import { Client } from 'pg'

/**
 * Tests run against a dedicated database so a stray `pnpm test` can never
 * truncate development data. Derived from DATABASE_URL by renaming the
 * database, or set TEST_DATABASE_URL explicitly.
 */
export function resolveTestUrl(): string {
  if (process.env.TEST_DATABASE_URL) return process.env.TEST_DATABASE_URL

  const base = process.env.DATABASE_URL

  if (!base) throw new Error('DATABASE_URL is required to resolve the test database')

  const url = new URL(base)
  url.pathname = `${url.pathname.replace(/^\//, '')}_test`

  return url.toString()
}

/** Connects to `postgres` first, because CREATE DATABASE cannot run inside the target. */
export async function ensureTestDatabase(url: string): Promise<void> {
  const target = new URL(url)
  const databaseName = target.pathname.replace(/^\//, '')
  const adminUrl = new URL(url)
  adminUrl.pathname = '/postgres'

  const client = new Client({ connectionString: adminUrl.toString() })

  await client.connect()

  try {
    const existing = await client.query('select 1 from pg_database where datname = $1', [
      databaseName,
    ])

    if (existing.rowCount === 0) {
      await client.query(`create database "${databaseName}"`)
    }
  } finally {
    await client.end()
  }
}
