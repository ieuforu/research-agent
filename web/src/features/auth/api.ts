import { apiGet, apiPost } from '#/lib/http.ts'

export interface AuthUser {
  id: string
  email: string
  createdAt: string
}

export interface AuthSession {
  token: string
  user: AuthUser
}

export async function login(email: string, password: string): Promise<AuthSession> {
  const data = await apiPost<AuthSession>('auth/login', { json: { email, password } })

  if (!data?.token) throw new Error('登录失败')

  return data
}

export async function register(email: string, password: string): Promise<AuthSession> {
  const data = await apiPost<AuthSession>('auth/register', { json: { email, password } })

  if (!data?.token) throw new Error('注册失败')

  return data
}

export async function fetchMe(): Promise<AuthUser> {
  const data = await apiGet<{ user: AuthUser }>('auth/me')

  if (!data?.user) throw new Error('会话已失效')

  return data.user
}
