import { eq } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { buildApp } from '../app.js'
import { db } from '../db/index.js'
import { researchTasks } from '../db/schema.js'
import { closeDatabase, resetDatabase, waitFor } from '../../test/helpers.js'

const model = vi.hoisted(() => ({
  create: vi.fn(async (params: unknown) => {
    const { stream } = params as { stream?: boolean }

    if (!stream) return { choices: [{ message: { content: '{"queries":["q"]}' } }] }

    return (async function* generate() {
      yield { choices: [{ delta: { content: 'report body' } }] }
    })()
  }),
}))

vi.mock('../lib/ai.js', () => ({
  ai: { chat: { completions: { create: model.create } } },
  model: 'test-model',
}))

vi.mock('../lib/tavily.js', () => ({
  isSearchConfigured: () => false,
  searchWeb: vi.fn(),
}))

let app: FastifyInstance
let baseUrl: string

type ListBody = { tasks: { id: string; question: string }[]; nextCursor: string | null }

async function insertTask(question: string, createdAt: Date) {
  const [task] = await db.insert(researchTasks).values({ question, createdAt }).returning()

  return task
}

beforeAll(async () => {
  app = await buildApp({ logger: false })
  await app.listen({ port: 0, host: '127.0.0.1' })

  const address = app.server.address()

  if (typeof address === 'string' || address === null) throw new Error('no ephemeral port')

  baseUrl = `http://127.0.0.1:${address.port}`
})

afterAll(async () => {
  await app.close()
  await closeDatabase()
})

beforeEach(async () => {
  await resetDatabase()
  vi.clearAllMocks()
})

describe('POST /api/research', () => {
  it('rejects a missing question', async () => {
    const response = await app.inject({ method: 'POST', url: '/api/research', payload: {} })

    expect(response.statusCode).toBe(400)
    expect(response.json()).toMatchObject({ error: 'Invalid request' })
  })

  it('accepts a question, returns 202 and runs the task in the background', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/research',
      payload: { question: '  what is mvcc  ' },
    })

    expect(response.statusCode).toBe(202)

    const body = response.json() as { task: { id: string; status: string; question: string } }

    expect(body.task.status).toBe('pending')
    expect(body.task.question).toBe('what is mvcc')

    const completed = await waitFor(async () => {
      const [task] = await db
        .select()
        .from(researchTasks)
        .where(eq(researchTasks.id, body.task.id))
        .limit(1)

      return task?.status === 'completed' ? task : undefined
    })

    expect(completed.report).toBe('report body')
  })
})

describe('GET /api/research', () => {
  it('walks every page with the cursor without skipping or duplicating rows', async () => {
    const expected = [
      await insertTask('third', new Date('2026-10-21T03:00:00.000Z')),
      await insertTask('second', new Date('2026-10-21T02:00:00.000Z')),
      await insertTask('first', new Date('2026-10-21T01:00:00.000Z')),
    ]

    const collected: string[] = []
    let cursor: string | null = null
    let pages = 0

    do {
      const url: string = `/api/research?limit=2${cursor ? `&cursor=${cursor}` : ''}`
      const response = await app.inject({ method: 'GET', url })

      expect(response.statusCode).toBe(200)

      const body = response.json() as ListBody

      collected.push(...body.tasks.map((task) => task.id))
      cursor = body.nextCursor
      pages += 1
    } while (cursor)

    expect(pages).toBe(2)
    expect(collected).toEqual(expected.map((task) => task.id))
  })

  it('filters by status', async () => {
    const pending = await insertTask('pending one', new Date('2026-10-21T03:00:00.000Z'))

    await insertTask('completed one', new Date('2026-10-21T02:00:00.000Z'))
    await db
      .update(researchTasks)
      .set({ status: 'completed', report: 'x' })
      .where(eq(researchTasks.question, 'completed one'))

    const response = await app.inject({ method: 'GET', url: '/api/research?status=pending' })
    const body = response.json() as ListBody

    expect(body.tasks.map((task) => task.id)).toEqual([pending.id])
  })

  it('rejects an invalid cursor and out-of-range limits', async () => {
    const badCursor = await app.inject({ method: 'GET', url: '/api/research?cursor=nope!!' })
    const badLimit = await app.inject({ method: 'GET', url: '/api/research?limit=0' })

    expect(badCursor.statusCode).toBe(400)
    expect(badLimit.statusCode).toBe(400)
  })

  it('omits the report body from list rows', async () => {
    await insertTask('with report', new Date('2026-10-21T03:00:00.000Z'))
    await db
      .update(researchTasks)
      .set({ status: 'completed', report: 'a long report' })
      .where(eq(researchTasks.question, 'with report'))

    const response = await app.inject({ method: 'GET', url: '/api/research' })
    const body = response.json() as { tasks: Record<string, unknown>[] }

    expect(body.tasks[0]).not.toHaveProperty('report')
    expect(body.tasks[0]).toHaveProperty('status', 'completed')
  })
})

describe('GET /api/research/:id', () => {
  it('validates, 404s and returns the full task', async () => {
    const invalid = await app.inject({ method: 'GET', url: '/api/research/not-a-uuid' })
    const missing = await app.inject({
      method: 'GET',
      url: `/api/research/${crypto.randomUUID()}`,
    })
    const task = await insertTask('detail', new Date('2026-10-21T03:00:00.000Z'))
    const found = await app.inject({ method: 'GET', url: `/api/research/${task.id}` })

    expect(invalid.statusCode).toBe(400)
    expect(missing.statusCode).toBe(404)
    expect(found.statusCode).toBe(200)
    expect(found.json()).toMatchObject({ task: { id: task.id, status: 'pending' } })
  })
})

describe('POST /api/research/:id/cancel', () => {
  it('cancels a pending task', async () => {
    const task = await insertTask('cancel me', new Date('2026-10-21T03:00:00.000Z'))

    const response = await app.inject({
      method: 'POST',
      url: `/api/research/${task.id}/cancel`,
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchObject({ task: { status: 'cancelled' } })
  })

  it('returns 409 for a terminal task and 404 for an unknown one', async () => {
    const task = await insertTask('already done', new Date('2026-10-21T03:00:00.000Z'))
    await db
      .update(researchTasks)
      .set({ status: 'completed', report: 'x' })
      .where(eq(researchTasks.id, task.id))

    const conflict = await app.inject({
      method: 'POST',
      url: `/api/research/${task.id}/cancel`,
    })
    const missing = await app.inject({
      method: 'POST',
      url: `/api/research/${crypto.randomUUID()}/cancel`,
    })

    expect(conflict.statusCode).toBe(409)
    expect(missing.statusCode).toBe(404)
  })
})

describe('GET /api/research/:id/stream', () => {
  it('emits a terminal event and closes for a finished task', async () => {
    const task = await insertTask('stream me', new Date('2026-10-21T03:00:00.000Z'))
    await db
      .update(researchTasks)
      .set({ status: 'completed', report: 'streamed body' })
      .where(eq(researchTasks.id, task.id))

    const response = await fetch(`${baseUrl}/api/research/${task.id}/stream`)

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('text/event-stream')

    const payload = await response.text()

    expect(payload).toContain('event: done')
    expect(payload).toContain('streamed body')
  })

  it('404s for an unknown task', async () => {
    const response = await fetch(`${baseUrl}/api/research/${crypto.randomUUID()}/stream`)

    expect(response.status).toBe(404)
  })
})
