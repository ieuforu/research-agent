import cors from '@fastify/cors'
import Fastify from 'fastify'

import { researchRoutes } from './routes/research.js'
import { recoverInterruptedTasks } from './services/research.js'

const app = Fastify({
  logger: true,
})

await app.register(cors, {
  origin: process.env.WEB_ORIGIN ?? 'http://localhost:5173',
})

app.get('/api/health', async () => {
  return {
    status: 'ok',
    service: 'research-agent-api',
  }
})

await app.register(researchRoutes, {
  prefix: '/api',
})

const port = Number(process.env.PORT ?? 3000)

// Execution lives in this process, so any `running` row found at boot is stale.
const recovered = await recoverInterruptedTasks()

if (recovered > 0) {
  app.log.warn({ count: recovered }, 'Marked interrupted research tasks as failed')
}

try {
  await app.listen({
    port,
    host: '0.0.0.0',
  })
} catch (error) {
  app.log.error(error)
  process.exit(1)
}
