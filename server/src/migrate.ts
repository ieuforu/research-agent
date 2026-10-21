/**
 * Runs Drizzle migrations programmatically so a container can bring the schema
 * up to date before it starts serving. Using the migrator (not `drizzle-kit
 * push`) keeps deployed schemas reproducible from the committed migration files.
 */
import 'dotenv/config'
import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { Pool } from 'pg'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL is not configured')
}

const pool = new Pool({ connectionString })

try {
  await migrate(drizzle({ client: pool }), { migrationsFolder: './drizzle' })
  console.log('[migrate] migrations applied')
} finally {
  await pool.end()
}
