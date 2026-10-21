import { and, eq, inArray } from 'drizzle-orm'
import { z } from 'zod'

import { ai, model } from '../lib/ai.js'
import { db } from '../db/index.js'
import { researchTasks } from '../db/schema.js'
import { isSearchConfigured, searchWeb, type SearchResult } from '../lib/tavily.js'
import { finish, publish, type ResearchSource } from '../lib/taskEvents.js'

const ACTIVE_STATUSES = ['pending', 'running'] as const
const MAX_SOURCES = 6

/**
 * In-flight model calls, keyed by task id, so a cancel request can abort the
 * upstream HTTP request instead of only flipping a database column.
 */
const inflight = new Map<string, AbortController>()

const searchPlanSchema = z.object({
  queries: z.array(z.string()).default([]),
})

const BASE_SYSTEM_PROMPT =
  '你是一名严谨的研究助手。请用中文回答用户的研究问题，明确区分事实、推断和不确定信息。'

const NO_SEARCH_HINT = '当前未接入搜索工具，你只能依据自身知识作答，不得编造来源、链接或引用。'

/** Ownership is part of the lookup, so a foreign task is indistinguishable from a missing one. */
export async function findTaskForUser(taskId: string, userId: string) {
  const [task] = await db
    .select()
    .from(researchTasks)
    .where(and(eq(researchTasks.id, taskId), eq(researchTasks.userId, userId)))
    .limit(1)

  return task
}

export async function getResearchTask(taskId: string) {
  const [task] = await db.select().from(researchTasks).where(eq(researchTasks.id, taskId)).limit(1)

  return task
}

/** Asks the model for up to three concrete web queries; falls back to the question. */
async function planSearchQueries(question: string, signal: AbortSignal): Promise<string[]> {
  try {
    const completion = await ai.chat.completions.create(
      {
        model,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              '你是检索规划器。根据用户的研究问题，输出 1 到 3 条用于网络搜索的查询语句，语言与问题一致，具体且可直接搜索。只输出 JSON：{"queries": ["..."]}',
          },
          { role: 'user', content: question },
        ],
      },
      { signal },
    )

    const raw = completion.choices[0]?.message.content ?? ''
    const parsed = searchPlanSchema.safeParse(JSON.parse(raw))

    if (!parsed.success) return [question]

    const queries = parsed.data.queries
      .map((query) => query.trim())
      .filter((query) => query.length > 0)
      .slice(0, 3)

    return queries.length > 0 ? queries : [question]
  } catch {
    // Planning is best-effort: a malformed plan must not fail the task.
    return [question]
  }
}

/** Runs every query, de-duplicates by URL and keeps the first MAX_SOURCES hits. */
async function gatherSources(queries: string[], signal: AbortSignal): Promise<ResearchSource[]> {
  const settled = await Promise.allSettled(
    queries.map((query) => searchWeb(query, { maxResults: 5, signal })),
  )

  const seen = new Set<string>()
  const sources: ResearchSource[] = []

  for (const result of settled) {
    if (result.status !== 'fulfilled') continue

    for (const item of result.value as SearchResult[]) {
      if (seen.has(item.url)) continue

      seen.add(item.url)
      sources.push(item)

      if (sources.length >= MAX_SOURCES) return sources
    }
  }

  return sources
}

function buildMessages(question: string, sources: ResearchSource[]) {
  if (sources.length === 0) {
    return [
      { role: 'system' as const, content: `${BASE_SYSTEM_PROMPT}${NO_SEARCH_HINT}` },
      { role: 'user' as const, content: question },
    ]
  }

  const references = sources
    .map((source, index) => `[${index + 1}] ${source.title} — ${source.url}\n${source.snippet}`)
    .join('\n\n')

  return [
    {
      role: 'system' as const,
      content: [
        BASE_SYSTEM_PROMPT,
        '你拿到了若干检索结果。写作要求：',
        '1. 只依据下列参考资料作答，用 [1] 这样的角标标注引用，角标编号必须对应下方资料编号。',
        '2. 资料不足以回答的部分，明确写出「资料未覆盖」，不要用自身知识补充成事实。',
        '3. 不要新增、改写或猜测链接。',
      ].join('\n'),
    },
    {
      role: 'system' as const,
      content: `参考资料：\n\n${references}`,
    },
    { role: 'user' as const, content: question },
  ]
}

async function streamReport(options: {
  taskId: string
  question: string
  sources: ResearchSource[]
  signal: AbortSignal
}): Promise<string> {
  const { taskId, question, sources, signal } = options

  const stream = await ai.chat.completions.create(
    {
      model,
      stream: true,
      messages: buildMessages(question, sources),
    },
    { signal },
  )

  let report = ''

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content

    if (!delta) continue

    report += delta
    publish(taskId, { type: 'token', delta })
  }

  return report
}

export async function executeResearch(taskId: string) {
  const task = await getResearchTask(taskId)

  if (!task) {
    throw new Error(`Research task not found: ${taskId}`)
  }

  // Only pending tasks are executed. A cancel that landed between INSERT and
  // this call must win, and re-running a finished task would clobber its report.
  if (task.status !== 'pending') {
    return task
  }

  const controller = new AbortController()
  inflight.set(taskId, controller)

  try {
    // Conditional update: if a cancel already moved the row out of `pending`,
    // no row is returned and the model call never starts.
    const [started] = await db
      .update(researchTasks)
      .set({
        status: 'running',
        updatedAt: new Date(),
        error: null,
      })
      .where(and(eq(researchTasks.id, taskId), eq(researchTasks.status, 'pending')))
      .returning()

    if (!started) {
      return await getResearchTask(taskId)
    }

    publish(taskId, { type: 'status', status: 'running' })

    let sources: ResearchSource[] = []

    if (isSearchConfigured()) {
      const queries = await planSearchQueries(started.question, controller.signal)
      sources = await gatherSources(queries, controller.signal)

      if (sources.length > 0) {
        publish(taskId, { type: 'sources', sources })
      }
    }

    const report = await streamReport({
      taskId,
      question: started.question,
      sources,
      signal: controller.signal,
    })

    if (!report.trim()) {
      throw new Error('Model returned an empty report')
    }

    const [updatedTask] = await db
      .update(researchTasks)
      .set({
        status: 'completed',
        report,
        sources: sources.length > 0 ? sources : null,
        updatedAt: new Date(),
      })
      // Guard against overwriting a report that was cancelled mid-flight.
      .where(and(eq(researchTasks.id, taskId), eq(researchTasks.status, 'running')))
      .returning()

    const finalTask = updatedTask ?? (await getResearchTask(taskId))

    if (finalTask) {
      finish(taskId, { type: 'done', task: finalTask })
    }

    return finalTask
  } catch (error) {
    // A user-initiated cancel aborts the request; that is not a failure. The
    // cancel endpoint already published the terminal event for that path.
    if (controller.signal.aborted) {
      return await getResearchTask(taskId)
    }

    const message = error instanceof Error ? error.message : 'Unknown research error'

    await db
      .update(researchTasks)
      .set({
        status: 'failed',
        error: message.slice(0, 2000),
        updatedAt: new Date(),
      })
      .where(and(eq(researchTasks.id, taskId), eq(researchTasks.status, 'running')))

    finish(taskId, { type: 'error', message })

    throw error
  } finally {
    inflight.delete(taskId)
  }
}

export type CancelOutcome =
  | { outcome: 'cancelled'; task: typeof researchTasks.$inferSelect }
  | { outcome: 'conflict'; task: typeof researchTasks.$inferSelect }
  | { outcome: 'not_found' }

export async function cancelResearch(taskId: string, userId: string): Promise<CancelOutcome> {
  const task = await findTaskForUser(taskId, userId)

  if (!task) {
    return { outcome: 'not_found' }
  }

  if (!ACTIVE_STATUSES.includes(task.status as (typeof ACTIVE_STATUSES)[number])) {
    return { outcome: 'conflict', task }
  }

  const [updated] = await db
    .update(researchTasks)
    .set({
      status: 'cancelled',
      updatedAt: new Date(),
      error: null,
    })
    .where(
      and(
        eq(researchTasks.id, taskId),
        eq(researchTasks.userId, userId),
        inArray(researchTasks.status, [...ACTIVE_STATUSES]),
      ),
    )
    .returning()

  if (!updated) {
    // Lost the race against task completion.
    return { outcome: 'conflict', task: (await findTaskForUser(taskId, userId)) ?? task }
  }

  publish(taskId, { type: 'status', status: 'cancelled' })
  finish(taskId, { type: 'done', task: updated })
  inflight.get(taskId)?.abort()

  return { outcome: 'cancelled', task: updated }
}

/**
 * `running` rows cannot survive a process restart, because execution lives in
 * this process. Marking them failed keeps the workbench honest instead of
 * showing a task that will never progress.
 */
export async function recoverInterruptedTasks(): Promise<number> {
  const interrupted = await db
    .update(researchTasks)
    .set({
      status: 'failed',
      error: '服务重启，任务被中断',
      updatedAt: new Date(),
    })
    .where(eq(researchTasks.status, 'running'))
    .returning({ id: researchTasks.id })

  return interrupted.length
}

export { ACTIVE_STATUSES }
