import type { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { buildApp, redactUrl } from './app.js'
import { closeDatabase } from '../test/helpers.js'

vi.mock('./lib/ai.js', () => ({
  ai: { chat: { completions: { create: vi.fn() } } },
  model: 'test-model',
}))

vi.mock('./lib/tavily.js', () => ({
  isSearchConfigured: () => false,
  searchWeb: vi.fn(),
}))

const SECRET_TOKEN = 'jwt-that-must-never-be-logged'

let app: FastifyInstance
const lines: string[] = []

beforeAll(async () => {
  app = await buildApp({
    logger: {
      level: 'info',
      stream: {
        write(line: string) {
          lines.push(line)
        },
      },
    },
  })
})

afterAll(async () => {
  await app.close()
  await closeDatabase()
})

describe('redactUrl', () => {
  it('replaces the token query parameter', () => {
    expect(redactUrl(`/api/research/abc/stream?token=${SECRET_TOKEN}`)).toBe(
      '/api/research/abc/stream?token=redacted',
    )
  })

  it('keeps other query parameters intact', () => {
    expect(redactUrl('/api/research?limit=2&cursor=xyz&token=abc')).toBe(
      '/api/research?limit=2&cursor=xyz&token=redacted',
    )
  })

  it('leaves urls without a token untouched', () => {
    expect(redactUrl('/api/research?limit=2')).toBe('/api/research?limit=2')
    expect(redactUrl('/api/health')).toBe('/api/health')
  })
})

describe('request logging', () => {
  it('never writes a query-string token to the log', async () => {
    lines.length = 0

    await app.inject({
      method: 'GET',
      url: `/api/research/11111111-1111-4111-8111-111111111111/stream?token=${SECRET_TOKEN}`,
    })

    const output = lines.join('\n')

    expect(output).toContain('/stream')
    expect(output).not.toContain(SECRET_TOKEN)
    expect(output).toContain('token=redacted')
  })

  it('still logs the request id and method', async () => {
    lines.length = 0

    await app.inject({ method: 'GET', url: '/api/health', headers: { 'x-request-id': 'trace-42' } })

    const output = lines.join('\n')

    expect(output).toContain('trace-42')
    expect(output).toContain('/api/health')
  })
})
