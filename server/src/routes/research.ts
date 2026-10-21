import { and, desc, eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import type { FastifyPluginAsync } from 'fastify'

import { db } from '../db/index.js'
import { researchTasks } from '../db/schema.js'
import { decodeCursor, encodeCursor } from '../lib/pagination.js'
import { isTerminal, replay, subscribe, type ResearchEvent } from '../lib/taskEvents.js'
import { cancelResearch, executeResearch, getResearchTask } from '../services/research.js'

const statusSchema = z.enum(['pending', 'running', 'completed', 'failed', 'cancelled'])

const createResearchSchema = z.object({
  question: z.string().trim().min(1).max(10_000),
})

const listResearchSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().min(1).optional(),
  status: statusSchema.optional(),
})

const taskIdSchema = z.object({
  id: z.string().uuid(),
})

export const researchRoutes: FastifyPluginAsync = async (app) => {
  app.post('/research', async (request, reply) => {
    const parsed = createResearchSchema.safeParse(request.body)

    if (!parsed.success) {
      return reply.code(400).send({
        error: 'Invalid request',
        details: parsed.error.issues,
      })
    }

    const [task] = await db
      .insert(researchTasks)
      .values({
        question: parsed.data.question,
      })
      .returning()

    void executeResearch(task.id).catch((error) => {
      app.log.error({ err: error, taskId: task.id }, 'Research execution failed')
    })

    return reply.code(202).send({ task })
  })

  /**
   * Keyset-paginated list. `report` and `sources` are intentionally omitted so
   * the workbench polls a small payload; fetch a single task for the full body.
   */
  app.get('/research', async (request, reply) => {
    const parsed = listResearchSchema.safeParse(request.query)

    if (!parsed.success) {
      return reply.code(400).send({
        error: 'Invalid query',
        details: parsed.error.issues,
      })
    }

    const { limit, cursor, status } = parsed.data
    const decoded = cursor ? decodeCursor(cursor) : null

    if (cursor && !decoded) {
      return reply.code(400).send({ error: 'Invalid cursor' })
    }

    const conditions = [
      status ? eq(researchTasks.status, status) : undefined,
      decoded
        ? sql`(${researchTasks.createdAt}, ${researchTasks.id}) < (${decoded.createdAt.toISOString()}::timestamptz, ${decoded.id}::uuid)`
        : undefined,
    ].filter((condition) => condition !== undefined)

    const rows = await db
      .select({
        id: researchTasks.id,
        question: researchTasks.question,
        status: researchTasks.status,
        error: researchTasks.error,
        createdAt: researchTasks.createdAt,
        updatedAt: researchTasks.updatedAt,
      })
      .from(researchTasks)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(researchTasks.createdAt), desc(researchTasks.id))
      .limit(limit + 1)

    const hasMore = rows.length > limit
    const tasks = hasMore ? rows.slice(0, limit) : rows
    const last = tasks.at(-1)

    return {
      tasks,
      nextCursor: hasMore && last ? encodeCursor(last.createdAt, last.id) : null,
    }
  })

  app.get('/research/:id', async (request, reply) => {
    const parsed = taskIdSchema.safeParse(request.params)

    if (!parsed.success) {
      return reply.code(400).send({
        error: 'Invalid task ID',
      })
    }

    const [task] = await db
      .select()
      .from(researchTasks)
      .where(eq(researchTasks.id, parsed.data.id))
      .limit(1)

    if (!task) {
      return reply.code(404).send({
        error: 'Research task not found',
      })
    }

    return { task }
  })

  app.post('/research/:id/cancel', async (request, reply) => {
    const parsed = taskIdSchema.safeParse(request.params)

    if (!parsed.success) {
      return reply.code(400).send({
        error: 'Invalid task ID',
      })
    }

    const result = await cancelResearch(parsed.data.id)

    if (result.outcome === 'not_found') {
      return reply.code(404).send({ error: 'Research task not found' })
    }

    if (result.outcome === 'conflict') {
      return reply.code(409).send({
        error: `Task is already ${result.task.status}`,
        task: result.task,
      })
    }

    return { task: result.task }
  })

  /**
   * Server-sent events for a task: replays buffered events (so a late subscriber
   * still sees sources and already-streamed text), then follows live ones until
   * the task reaches a terminal state.
   */
  app.get('/research/:id/stream', async (request, reply) => {
    const parsed = taskIdSchema.safeParse(request.params)

    if (!parsed.success) {
      return reply.code(400).send({ error: 'Invalid task ID' })
    }

    const task = await getResearchTask(parsed.data.id)

    if (!task) {
      return reply.code(404).send({ error: 'Research task not found' })
    }

    reply.hijack()

    const response = reply.raw
    response.writeHead(200, {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-cache, no-transform',
      connection: 'keep-alive',
      'x-accel-buffering': 'no',
    })

    const send = (event: ResearchEvent) => {
      response.write(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`)
    }

    const buffered = replay(task.id)

    for (const event of buffered) {
      send(event)
    }

    if (isTerminal(task.status)) {
      // A task that finished before this process started has no buffer, so the
      // client still needs a terminal event to stop waiting.
      if (buffered.length === 0) {
        send({ type: 'done', task })
      }

      response.end()

      return
    }

    const unsubscribe = subscribe(task.id, send)
    const heartbeat = setInterval(() => response.write(': ping\n\n'), 15_000)

    request.raw.on('close', () => {
      clearInterval(heartbeat)
      unsubscribe()
    })
  })
}
