import 'dotenv/config'
import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { Pool } from 'pg'

import { ensureTestDatabase, resolveTestUrl } from './database.js'

export default async function globalSetup(): Promise<void> {
  const url = resolveTestUrl()

  await ensureTestDatabase(url)

  const pool = new Pool({ connectionString: url })

  try {
    await migrate(drizzle({ client: pool }), { migrationsFolder: './drizzle' })
  } finally {
    await pool.end()
  }
}
