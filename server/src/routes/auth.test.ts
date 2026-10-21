import { eq } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { buildApp } from '../app.js'
import { db } from '../db/index.js'
import { users } from '../db/schema.js'
import { closeDatabase, resetDatabase } from '../../test/helpers.js'

// Auth routes never touch the model or search layer, but `buildApp` imports the
// research routes, which import them at module scope.
vi.mock('../lib/ai.js', () => ({
  ai: { chat: { completions: { create: vi.fn() } } },
  model: 'test-model',
}))

vi.mock('../lib/tavily.js', () => ({
  isSearchConfigured: () => false,
  searchWeb: vi.fn(),
}))

const PASSWORD = 'correct horse battery staple'

let app: FastifyInstance

function register(payload: unknown) {
  return app.inject({ method: 'POST', url: '/api/auth/register', payload: payload as object })
}

function login(payload: unknown) {
  return app.inject({ method: 'POST', url: '/api/auth/login', payload: payload as object })
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
})

describe('POST /api/auth/register', () => {
  it('creates a user and returns a usable token', async () => {
    const response = await register({ email: 'Someone@Example.com', password: PASSWORD })

    expect(response.statusCode).toBe(201)

    const body = response.json() as { token: string; user: { id: string; email: string } }

    expect(body.user.email).toBe('someone@example.com')
    expect(body.user).not.toHaveProperty('passwordHash')

    const me = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { authorization: `Bearer ${body.token}` },
    })

    expect(me.statusCode).toBe(200)
    expect(me.json()).toMatchObject({ user: { id: body.user.id } })
  })

  it('stores a salted hash, never the password', async () => {
    await register({ email: 'hash@example.com', password: PASSWORD })

    const [row] = await db.select().from(users).where(eq(users.email, 'hash@example.com'))

    expect(row.passwordHash).not.toContain(PASSWORD)
    expect(row.passwordHash.startsWith('scrypt$')).toBe(true)
  })

  it('rejects a duplicate email with 409', async () => {
    await register({ email: 'dup@example.com', password: PASSWORD })

    const response = await register({ email: 'dup@example.com', password: PASSWORD })

    expect(response.statusCode).toBe(409)
    expect(response.json()).toMatchObject({ error: 'Email is already registered' })
  })

  it.each([
    ['invalid email', { email: 'not-an-email', password: PASSWORD }],
    ['short password', { email: 'short@example.com', password: 'short' }],
    ['missing password', { email: 'empty@example.com' }],
  ])('rejects %s', async (_label, payload) => {
    const response = await register(payload)

    expect(response.statusCode).toBe(400)
  })
})

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await register({ email: 'login@example.com', password: PASSWORD })
  })

  it('returns a token for valid credentials', async () => {
    const response = await login({ email: 'LOGIN@example.com', password: PASSWORD })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toHaveProperty('token')
  })

  it('rejects a wrong password with 401', async () => {
    const response = await login({ email: 'login@example.com', password: 'wrong but long enough' })

    expect(response.statusCode).toBe(401)
    expect(response.json()).toMatchObject({ error: 'Invalid email or password' })
  })

  it('gives an unknown email the same response as a wrong password', async () => {
    const unknown = await login({ email: 'nobody@example.com', password: PASSWORD })
    const wrong = await login({ email: 'login@example.com', password: 'wrong but long enough' })

    expect(unknown.statusCode).toBe(wrong.statusCode)
    expect(unknown.json()).toEqual(wrong.json())
  })
})

describe('GET /api/auth/me', () => {
  it('requires a token', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/auth/me' })

    expect(response.statusCode).toBe(401)
  })

  it('rejects an expired token', async () => {
    const expired = app.jwt.sign(
      { sub: crypto.randomUUID(), email: 'x@example.com' },
      { expiresIn: -10 },
    )

    const response = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { authorization: `Bearer ${expired}` },
    })

    expect(response.statusCode).toBe(401)
  })

  it('401s when the token is valid but the user is gone', async () => {
    const token = app.jwt.sign({ sub: crypto.randomUUID(), email: 'ghost@example.com' })

    const response = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { authorization: `Bearer ${token}` },
    })

    expect(response.statusCode).toBe(401)
  })
})
