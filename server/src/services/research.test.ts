import { and, eq } from 'drizzle-orm'
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '../db/index.js'
import { researchTasks } from '../db/schema.js'
import { replay, subscribe, type ResearchEvent } from '../lib/taskEvents.js'
import { cancelResearch, executeResearch } from './research.js'
import { closeDatabase, resetDatabase, waitFor } from '../../test/helpers.js'

/**
 * The model and search layer are mocked: these tests are about the state
 * machine, cancellation races and persistence — not about DeepSeek or Tavily.
 */
const model = vi.hoisted(() => {
  const state = {
    planContent: '{"queries":["query one"]}',
    deltas: ['first ', 'second'] as string[],
    failStream: false,
    /** Awaited before the first delta so a test can hold generation open. */
    gate: null as Promise<void> | null,
    /** Models a provider that does not honour the abort signal mid-stream. */
    ignoreAbort: false,
    abortObserved: false,
    create: vi.fn(),
  }

  state.create = vi.fn(async (params: unknown, options?: { signal?: AbortSignal }) => {
    const { stream } = params as { stream?: boolean }

    if (!stream) {
      return { choices: [{ message: { content: state.planContent } }] }
    }

    if (state.failStream) {
      throw new Error('upstream model exploded')
    }

    return (async function* generate() {
      if (state.gate) await state.gate

      for (const delta of state.deltas) {
        if (!state.ignoreAbort && options?.signal?.aborted) {
          state.abortObserved = true
          throw Object.assign(new Error('aborted'), { name: 'AbortError' })
        }

        yield { choices: [{ delta: { content: delta } }] }
        await new Promise((resolve) => setTimeout(resolve, 1))
      }
    })()
  })

  return state
})

const search = vi.hoisted(() => ({
  configured: false,
  results: [] as { title: string; url: string; snippet: string }[],
  searchWeb: vi.fn(async () => search.results),
}))

vi.mock('../lib/ai.js', () => ({
  ai: { chat: { completions: { create: model.create } } },
  model: 'test-model',
}))

vi.mock('../lib/tavily.js', () => ({
  isSearchConfigured: () => search.configured,
  searchWeb: search.searchWeb,
}))

async function insertTask(question = 'what is mvcc') {
  const [task] = await db.insert(researchTasks).values({ question }).returning()

  return task
}

async function loadTask(id: string) {
  const [task] = await db.select().from(researchTasks).where(eq(researchTasks.id, id)).limit(1)

  return task
}

beforeEach(async () => {
  await resetDatabase()
  vi.clearAllMocks()
  model.planContent = '{"queries":["query one"]}'
  model.deltas = ['first ', 'second']
  model.failStream = false
  model.gate = null
  model.abortObserved = false
  model.ignoreAbort = false
  search.configured = false
  search.results = []
})

afterAll(async () => {
  await closeDatabase()
})

describe('executeResearch', () => {
  it('runs the task to completion and persists the report', async () => {
    const task = await insertTask()
    const events: ResearchEvent[] = []

    subscribe(task.id, (event) => events.push(event))

    const finished = await executeResearch(task.id)

    expect(finished?.status).toBe('completed')
    expect(finished?.report).toBe('first second')
    expect(finished?.sources).toBeNull()

    const types = events.map((event) => event.type)
    expect(types).toContain('status')
    expect(types).toContain('token')
    expect(types).toContain('done')
    // Without a search key the planner is skipped entirely.
    expect(model.create).toHaveBeenCalledTimes(1)
  })

  it('skips execution when the task is not pending', async () => {
    const task = await insertTask()

    await cancelResearch(task.id)
    model.create.mockClear()

    const result = await executeResearch(task.id)

    expect(result?.status).toBe('cancelled')
    expect(model.create).not.toHaveBeenCalled()
  })

  it('marks the task failed and truncates a long error message', async () => {
    const task = await insertTask()
    const events: ResearchEvent[] = []

    model.failStream = true
    subscribe(task.id, (event) => events.push(event))

    await expect(executeResearch(task.id)).rejects.toThrow('upstream model exploded')

    const stored = await loadTask(task.id)

    expect(stored.status).toBe('failed')
    expect(stored.error).toBe('upstream model exploded')
    expect(stored.report).toBeNull()
    expect(events.at(-1)).toEqual({ type: 'error', message: 'upstream model exploded' })
  })

  it('does not query again when the state is already terminal', async () => {
    const task = await insertTask()

    await db
      .update(researchTasks)
      .set({ status: 'completed', report: 'kept' })
      .where(eq(researchTasks.id, task.id))

    const result = await executeResearch(task.id)

    expect(result?.report).toBe('kept')
    expect(model.create).not.toHaveBeenCalled()
  })
})

describe('cancellation', () => {
  it('aborts generation and never overwrites the cancelled row', async () => {
    const task = await insertTask()
    let release: () => void = () => {}
    model.gate = new Promise<void>((resolve) => {
      release = resolve
    })

    const execution = executeResearch(task.id)

    // Wait until the task is actually running before cancelling, otherwise the
    // test would only cover the pending-cancel path.
    await waitFor(async () => (await loadTask(task.id))?.status === 'running')

    const cancelled = await cancelResearch(task.id)
    expect(cancelled.outcome).toBe('cancelled')

    release()
    const settled = await execution

    expect(settled?.status).toBe('cancelled')
    expect(model.abortObserved).toBe(true)

    const stored = await loadTask(task.id)

    expect(stored.status).toBe('cancelled')
    expect(stored.report).toBeNull()
    expect(stored.error).toBeNull()
  })

  it('keeps the cancelled state even when the provider ignores the abort', async () => {
    // Abort propagation is only half the protection: a provider (or a buffered
    // response) can still deliver the full report after cancellation. The
    // conditional UPDATE is what stops that report from resurrecting the row.
    const task = await insertTask()
    let release: () => void = () => {}
    model.gate = new Promise<void>((resolve) => {
      release = resolve
    })
    model.ignoreAbort = true

    const execution = executeResearch(task.id)

    await waitFor(async () => (await loadTask(task.id))?.status === 'running')
    await cancelResearch(task.id)

    release()
    const settled = await execution

    expect(settled?.status).toBe('cancelled')

    const stored = await loadTask(task.id)

    expect(stored.status).toBe('cancelled')
    expect(stored.report).toBeNull()
  })

  it('reports a conflict once the task is terminal', async () => {
    const task = await insertTask()

    await db
      .update(researchTasks)
      .set({ status: 'completed', report: 'done' })
      .where(and(eq(researchTasks.id, task.id)))

    const result = await cancelResearch(task.id)

    expect(result.outcome).toBe('conflict')
  })

  it('reports not_found for an unknown id', async () => {
    await expect(cancelResearch(crypto.randomUUID())).resolves.toEqual({ outcome: 'not_found' })
  })
})

describe('search integration', () => {
  beforeEach(() => {
    search.configured = true
    model.planContent = '{"queries":["q1","q2"]}'
    search.results = [
      { title: 'A', url: 'https://example.com/a', snippet: 'snippet a' },
      { title: 'B', url: 'https://example.com/b', snippet: 'snippet b' },
    ]
  })

  it('plans queries, de-duplicates urls and persists sources', async () => {
    const task = await insertTask()

    // Both queries return the same two urls, so de-duplication must collapse them.
    const finished = await executeResearch(task.id)

    expect(search.searchWeb).toHaveBeenCalledTimes(2)
    expect(finished?.sources).toHaveLength(2)
    expect(finished?.sources?.map((source) => source.url)).toEqual([
      'https://example.com/a',
      'https://example.com/b',
    ])
  })

  it('feeds numbered references into the synthesis prompt', async () => {
    const task = await insertTask()

    await executeResearch(task.id)

    const streamCall = model.create.mock.calls.find(
      ([params]) => (params as { stream?: boolean }).stream === true,
    )

    expect(streamCall).toBeDefined()

    const messages = (streamCall?.[0] as { messages: { content: string }[] }).messages
    const references = messages.map((message) => message.content).join('\n')

    expect(references).toContain('[1] A — https://example.com/a')
    expect(references).toContain('[2] B — https://example.com/b')
    expect(references).toContain('只依据下列参考资料作答')
    expect(references).toContain('资料未覆盖')
  })

  it('falls back to the raw question when planning returns invalid JSON', async () => {
    model.planContent = 'not json at all'
    const task = await insertTask()

    const finished = await executeResearch(task.id)

    expect(finished?.status).toBe('completed')
    expect(search.searchWeb).toHaveBeenCalledWith('what is mvcc', expect.anything())
  })

  it('still completes when the search provider fails', async () => {
    search.searchWeb.mockRejectedValueOnce(new Error('tavily down'))
    search.searchWeb.mockRejectedValueOnce(new Error('tavily down'))
    const task = await insertTask()

    const finished = await executeResearch(task.id)

    expect(finished?.status).toBe('completed')
    expect(finished?.sources).toBeNull()
    expect(replay(task.id).some((event) => event.type === 'sources')).toBe(false)
  })
})
