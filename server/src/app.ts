import cors from '@fastify/cors'
import Fastify, { type FastifyInstance } from 'fastify'

import authPlugin from './plugins/auth.js'
import { authRoutes } from './routes/auth.js'
import { researchRoutes } from './routes/research.js'

/**
 * Builds the app without listening, so tests can drive it through
 * `app.inject()` or an ephemeral listener.
 */
export async function buildApp(options: { logger?: boolean } = {}): Promise<FastifyInstance> {
  const app = Fastify({
    logger: options.logger ?? true,
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

  await app.register(authPlugin)
  await app.register(authRoutes, { prefix: '/api' })
  await app.register(researchRoutes, { prefix: '/api' })

  return app
}
