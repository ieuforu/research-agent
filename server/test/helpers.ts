import { pool } from '../src/db/index.js'

export async function resetDatabase(): Promise<void> {
  await pool.query('truncate table research_tasks restart identity cascade')
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
