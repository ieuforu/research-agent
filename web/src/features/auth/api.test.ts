import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchMe, login, register } from './api'

const http = vi.hoisted(() => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
}))

vi.mock('#/lib/http.ts', () => ({
  apiUrl: (path: string) => `/api${path}`,
  ...http,
}))

const session = {
  token: 'jwt-abc',
  user: { id: 'u1', email: 'a@example.com', createdAt: '2026-10-21T02:00:00.000Z' },
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('auth api', () => {
  it('logs in with the credentials in the body', async () => {
    http.apiPost.mockResolvedValue(session)

    await expect(login('a@example.com', 'password123')).resolves.toEqual(session)
    expect(http.apiPost).toHaveBeenCalledWith('auth/login', {
      json: { email: 'a@example.com', password: 'password123' },
    })
  })

  it('registers with the credentials in the body', async () => {
    http.apiPost.mockResolvedValue(session)

    await expect(register('a@example.com', 'password123')).resolves.toEqual(session)
    expect(http.apiPost).toHaveBeenCalledWith('auth/register', {
      json: { email: 'a@example.com', password: 'password123' },
    })
  })

  it('throws when a login response has no token', async () => {
    http.apiPost.mockResolvedValue({ user: session.user })

    await expect(login('a@example.com', 'password123')).rejects.toThrow('登录失败')
  })

  it('unwraps the current user', async () => {
    http.apiGet.mockResolvedValue({ user: session.user })

    await expect(fetchMe()).resolves.toEqual(session.user)
    expect(http.apiGet).toHaveBeenCalledWith('auth/me')
  })

  it('throws when the session is gone', async () => {
    http.apiGet.mockResolvedValue(undefined)

    await expect(fetchMe()).rejects.toThrow('会话已失效')
  })
})
