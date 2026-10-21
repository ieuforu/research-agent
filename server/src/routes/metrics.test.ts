import type { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { buildApp } from '../app.js'
import { db } from '../db/index.js'
import { researchTasks } from '../db/schema.js'
import { resetLifecycleForTests } from '../lib/lifecycle.js'
import { resetMetricsForTests } from '../lib/metrics.js'
import { closeDatabase, createUser, resetDatabase } from '../../test/helpers.js'

vi.mock('../lib/ai.js', () => ({
  ai: { chat: { completions: { create: vi.fn() } } },
  model: 'test-model',
}))

vi.mock('../lib/tavily.js', () => ({
  isSearchConfigured: () => false,
  searchWeb: vi.fn(),
}))

const TOKEN = 'metrics-test-token'

let app: FastifyInstance

type MetricsBody = {
  uptimeSeconds: number
  shuttingDown: boolean
  taskStatus: Record<string, number>
  gauges: { activeExecutions: number; openSseConnections: number }
  counters: Record<string, number>
}

beforeAll(async () => {
  app = await buildApp({ logger: false })
})

afterAll(async () => {
  await app.close()
  await closeDatabase()
})

beforeEach(async () => {
  await resetDatabase()
  resetLifecycleForTests()
  resetMetricsForTests()
  delete process.env.METRICS_TOKEN
})

describe('GET /api/metrics', () => {
  it('is not exposed at all when no token is configured', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/metrics' })

    expect(response.statusCode).toBe(404)
  })

  it('requires the configured bearer token', async () => {
    process.env.METRICS_TOKEN = TOKEN

    const anonymous = await app.inject({ method: 'GET', url: '/api/metrics' })
    const wrong = await app.inject({
      method: 'GET',
      url: '/api/metrics',
      headers: { authorization: 'Bearer nope' },
    })
    const accepted = await app.inject({
      method: 'GET',
      url: '/api/metrics',
      headers: { authorization: `Bearer ${TOKEN}` },
    })

    expect(anonymous.statusCode).toBe(401)
    expect(wrong.statusCode).toBe(401)
    expect(accepted.statusCode).toBe(200)
  })

  it('reports the task distribution from the database', async () => {
    process.env.METRICS_TOKEN = TOKEN
    const owner = await createUser()

    await db.insert(researchTasks).values([
      { question: 'one', userId: owner.id, status: 'completed' },
      { question: 'two', userId: owner.id, status: 'completed' },
      { question: 'three', userId: owner.id, status: 'failed' },
    ])

    const response = await app.inject({
      method: 'GET',
      url: '/api/metrics',
      headers: { authorization: `Bearer ${TOKEN}` },
    })

    const body = response.json() as MetricsBody

    expect(body.taskStatus.completed).toBe(2)
    expect(body.taskStatus.failed).toBe(1)
    expect(body.taskStatus.pending).toBe(0)
    expect(body.gauges).toEqual({ activeExecutions: 0, openSseConnections: 0 })
    expect(body.counters.tasksCreated).toBe(0)
    expect(body.uptimeSeconds).toBeGreaterThanOrEqual(0)
  })
})
