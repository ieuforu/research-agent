import { resolveTestUrl } from './database.js'

// Runs before any test module is imported, so `src/db/index.ts` picks up the
// test database the very first time it is evaluated. dotenv does not override
// variables that already exist, so an explicit assignment always wins.
process.env.DATABASE_URL = resolveTestUrl()
process.env.DEEPSEEK_API_KEY ??= 'test-deepseek-key'
process.env.DEEPSEEK_MODEL ??= 'deepseek-chat'
process.env.JWT_SECRET ??= 'test-jwt-secret'
process.env.JWT_EXPIRES_IN ??= '1h'
