import { db, pool } from '../src/db/index.js'
import { users } from '../src/db/schema.js'
import { hashPassword } from '../src/lib/password.js'

export async function resetDatabase(): Promise<void> {
  await pool.query('truncate table research_tasks, users restart identity cascade')
}

let userCounter = 0

/** Inserts a user directly; auth flows are covered separately in routes/auth.test.ts. */
export async function createUser(email?: string) {
  userCounter += 1

  const [user] = await db
    .insert(users)
    .values({
      email: email ?? `user${userCounter}-${crypto.randomUUID()}@example.com`,
      passwordHash: await hashPassword('correct horse battery staple'),
    })
    .returning()

  return user
}

export async function closeDatabase(): Promise<void> {
  await pool.end()
}

/** Polls until `predicate` returns a truthy value, then returns it. */
export async function waitFor<T>(
  predicate: () => Promise<T | undefined | null | false>,
  options: { timeoutMs?: number; intervalMs?: number } = {},
): Promise<T> {
  const timeoutMs = options.timeoutMs ?? 5_000
  const intervalMs = options.intervalMs ?? 20
  const deadline = Date.now() + timeoutMs

  while (Date.now() < deadline) {
    const value = await predicate()

    if (value) return value

    await new Promise((resolve) => setTimeout(resolve, intervalMs))
  }

  throw new Error('waitFor timed out')
}
