import { eq } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { buildApp } from '../app.js'
import { db } from '../db/index.js'
import { researchTasks } from '../db/schema.js'
import { beginShutdown, resetLifecycleForTests, runShutdownHandlers } from '../lib/lifecycle.js'
import { countersSnapshot, openSseConnections, resetMetricsForTests } from '../lib/metrics.js'
import { closeDatabase, createUser, resetDatabase, waitFor } from '../../test/helpers.js'

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
let owner: Awaited<ReturnType<typeof createUser>>
let auth: { authorization: string }

type ListBody = { tasks: { id: string; question: string }[]; nextCursor: string | null }

function tokenFor(user: { id: string; email: string }): string {
  return app.jwt.sign({ sub: user.id, email: user.email })
}

async function insertTask(question: string, createdAt: Date, userId?: string) {
  const [task] = await db
    .insert(researchTasks)
    .values({ question, createdAt, userId: userId ?? owner.id })
    .returning()

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
  resetLifecycleForTests()
  resetMetricsForTests()
  vi.clearAllMocks()

  owner = await createUser()
  auth = { authorization: `Bearer ${tokenFor(owner)}` }
})

describe('authentication', () => {
  it.each([
    { method: 'GET' as const, url: '/api/research' },
    { method: 'POST' as const, url: '/api/research' },
    { method: 'GET' as const, url: '/api/research/11111111-1111-4111-8111-111111111111' },
    { method: 'POST' as const, url: '/api/research/11111111-1111-4111-8111-111111111111/cancel' },
    { method: 'GET' as const, url: '/api/research/11111111-1111-4111-8111-111111111111/stream' },
  ])('rejects $method $url without a token', async ({ method, url }) => {
    const response = await app.inject({ method, url })

    expect(response.statusCode).toBe(401)
  })

  it('rejects a malformed token', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/research',
      headers: { authorization: 'Bearer not-a-jwt' },
    })

    expect(response.statusCode).toBe(401)
  })
})

describe('POST /api/research', () => {
  it('rejects a missing question', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/research',
      headers: auth,
      payload: {},
    })

    expect(response.statusCode).toBe(400)
    expect(response.json()).toMatchObject({ error: 'Invalid request' })
  })

  it('accepts a question, returns 202 and runs the task in the background', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/research',
      headers: auth,
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
    expect(completed.userId).toBe(owner.id)
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
      const response = await app.inject({ method: 'GET', url, headers: auth })

      expect(response.statusCode).toBe(200)

      const body = response.json() as ListBody

      collected.push(...body.tasks.map((task) => task.id))
      cursor = body.nextCursor
      pages += 1
    } while (cursor)

    expect(pages).toBe(2)
    expect(collected).toEqual(expected.map((task) => task.id))
  })

  it('never returns another user’s tasks', async () => {
    const stranger = await createUser()

    await insertTask('mine', new Date('2026-10-21T03:00:00.000Z'))
    const foreign = await insertTask('theirs', new Date('2026-10-21T04:00:00.000Z'), stranger.id)

    const response = await app.inject({ method: 'GET', url: '/api/research', headers: auth })
    const body = response.json() as ListBody

    expect(body.tasks.map((task) => task.question)).toEqual(['mine'])
    expect(body.tasks.map((task) => task.id)).not.toContain(foreign.id)
  })

  it('filters by status', async () => {
    const pending = await insertTask('pending one', new Date('2026-10-21T03:00:00.000Z'))

    await insertTask('completed one', new Date('2026-10-21T02:00:00.000Z'))
    await db
      .update(researchTasks)
      .set({ status: 'completed', report: 'x' })
      .where(eq(researchTasks.question, 'completed one'))

    const response = await app.inject({
      method: 'GET',
      url: '/api/research?status=pending',
      headers: auth,
    })
    const body = response.json() as ListBody

    expect(body.tasks.map((task) => task.id)).toEqual([pending.id])
  })

  it('rejects an invalid cursor and out-of-range limits', async () => {
    const badCursor = await app.inject({
      method: 'GET',
      url: '/api/research?cursor=nope!!',
      headers: auth,
    })
    const badLimit = await app.inject({
      method: 'GET',
      url: '/api/research?limit=0',
      headers: auth,
    })

    expect(badCursor.statusCode).toBe(400)
    expect(badLimit.statusCode).toBe(400)
  })

  it('omits the report body from list rows', async () => {
    await insertTask('with report', new Date('2026-10-21T03:00:00.000Z'))
    await db
      .update(researchTasks)
      .set({ status: 'completed', report: 'a long report' })
      .where(eq(researchTasks.question, 'with report'))

    const response = await app.inject({ method: 'GET', url: '/api/research', headers: auth })
    const body = response.json() as { tasks: Record<string, unknown>[] }

    expect(body.tasks[0]).not.toHaveProperty('report')
    expect(body.tasks[0]).toHaveProperty('status', 'completed')
  })
})

describe('GET /api/research/:id', () => {
  it('validates, 404s and returns the full task', async () => {
    const invalid = await app.inject({
      method: 'GET',
      url: '/api/research/not-a-uuid',
      headers: auth,
    })
    const missing = await app.inject({
      method: 'GET',
      url: `/api/research/${crypto.randomUUID()}`,
      headers: auth,
    })
    const task = await insertTask('detail', new Date('2026-10-21T03:00:00.000Z'))
    const found = await app.inject({
      method: 'GET',
      url: `/api/research/${task.id}`,
      headers: auth,
    })

    expect(invalid.statusCode).toBe(400)
    expect(missing.statusCode).toBe(404)
    expect(found.statusCode).toBe(200)
    expect(found.json()).toMatchObject({ task: { id: task.id, status: 'pending' } })
  })

  it('answers 404 — not 403 — for another user’s task', async () => {
    const stranger = await createUser()
    const foreign = await insertTask('theirs', new Date('2026-10-21T03:00:00.000Z'), stranger.id)

    const response = await app.inject({
      method: 'GET',
      url: `/api/research/${foreign.id}`,
      headers: auth,
    })

    expect(response.statusCode).toBe(404)
  })
})

describe('POST /api/research/:id/cancel', () => {
  it('cancels a pending task', async () => {
    const task = await insertTask('cancel me', new Date('2026-10-21T03:00:00.000Z'))

    const response = await app.inject({
      method: 'POST',
      url: `/api/research/${task.id}/cancel`,
      headers: auth,
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
      headers: auth,
    })
    const missing = await app.inject({
      method: 'POST',
      url: `/api/research/${crypto.randomUUID()}/cancel`,
      headers: auth,
    })

    expect(conflict.statusCode).toBe(409)
    expect(missing.statusCode).toBe(404)
  })

  it('cannot cancel another user’s task', async () => {
    const stranger = await createUser()
    const foreign = await insertTask('theirs', new Date('2026-10-21T03:00:00.000Z'), stranger.id)

    const response = await app.inject({
      method: 'POST',
      url: `/api/research/${foreign.id}/cancel`,
      headers: auth,
    })

    expect(response.statusCode).toBe(404)

    const [unchanged] = await db
      .select()
      .from(researchTasks)
      .where(eq(researchTasks.id, foreign.id))

    expect(unchanged.status).toBe('pending')
  })
})

describe('GET /api/research/:id/stream', () => {
  it('emits a terminal event and closes for a finished task', async () => {
    const task = await insertTask('stream me', new Date('2026-10-21T03:00:00.000Z'))
    await db
      .update(researchTasks)
      .set({ status: 'completed', report: 'streamed body' })
      .where(eq(researchTasks.id, task.id))

    const response = await fetch(`${baseUrl}/api/research/${task.id}/stream`, { headers: auth })

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('text/event-stream')

    const payload = await response.text()

    expect(payload).toContain('event: done')
    expect(payload).toContain('streamed body')
  })

  it('accepts the token as a query parameter, because EventSource cannot set headers', async () => {
    const task = await insertTask('query token', new Date('2026-10-21T03:00:00.000Z'))
    await db
      .update(researchTasks)
      .set({ status: 'completed', report: 'via query token' })
      .where(eq(researchTasks.id, task.id))

    const response = await fetch(
      `${baseUrl}/api/research/${task.id}/stream?token=${tokenFor(owner)}`,
    )

    expect(response.status).toBe(200)
    expect(await response.text()).toContain('via query token')
  })

  it('rejects a query token on non-stream endpoints', async () => {
    const response = await fetch(`${baseUrl}/api/research?token=${tokenFor(owner)}`)

    expect(response.status).toBe(401)
  })

  it('404s for an unknown task and for another user’s task', async () => {
    const stranger = await createUser()
    const foreign = await insertTask('theirs', new Date('2026-10-21T03:00:00.000Z'), stranger.id)

    const unknown = await fetch(`${baseUrl}/api/research/${crypto.randomUUID()}/stream`, {
      headers: auth,
    })
    const notMine = await fetch(`${baseUrl}/api/research/${foreign.id}/stream`, { headers: auth })

    expect(unknown.status).toBe(404)
    expect(notMine.status).toBe(404)
  })
})

describe('request tracing', () => {
  it('echoes an inbound request id', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/research',
      headers: { ...auth, 'x-request-id': 'trace-abc-123' },
    })

    expect(response.headers['x-request-id']).toBe('trace-abc-123')
  })

  it('mints a request id when the caller did not send one', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/research', headers: auth })

    expect(response.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/)
  })
})

describe('observability', () => {
  it('counts created and completed tasks', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/research',
      headers: auth,
      payload: { question: 'count me' },
    })

    const body = response.json() as { task: { id: string } }

    await waitFor(async () => {
      const [row] = await db
        .select()
        .from(researchTasks)
        .where(eq(researchTasks.id, body.task.id))
        .limit(1)

      return row?.status === 'completed' ? row : undefined
    })

    const counters = countersSnapshot()

    expect(counters.tasksCreated).toBe(1)
    expect(counters.tasksCompleted).toBe(1)
    expect(counters.tasksFailed).toBe(0)
  })

  it('refuses new tasks once draining', async () => {
    beginShutdown()

    const response = await app.inject({
      method: 'POST',
      url: '/api/research',
      headers: auth,
      payload: { question: 'too late' },
    })

    expect(response.statusCode).toBe(503)
    expect(model.create).not.toHaveBeenCalled()
  })

  it('ends open SSE streams on shutdown so the process can exit', async () => {
    const task = await insertTask('still running', new Date(), undefined)
    await db.update(researchTasks).set({ status: 'running' }).where(eq(researchTasks.id, task.id))

    const response = await fetch(`${baseUrl}/api/research/${task.id}/stream`, { headers: auth })

    expect(response.status).toBe(200)
    await waitFor(async () => openSseConnections() === 1)

    expect(runShutdownHandlers()).toBe(1)

    const payload = await new Response(response.body).text()

    expect(payload).toContain('server shutting down')
    expect(openSseConnections()).toBe(0)
  })
})
