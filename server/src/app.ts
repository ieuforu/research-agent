import { randomUUID } from 'node:crypto'
import cors from '@fastify/cors'
import Fastify, { type FastifyInstance, type FastifyServerOptions } from 'fastify'

import authPlugin from './plugins/auth.js'
import { authRoutes } from './routes/auth.js'
import { metricsRoutes } from './routes/metrics.js'
import { researchRoutes } from './routes/research.js'

// Query parameters that must never reach the logs. The SSE endpoint accepts a
// token in the query string because EventSource cannot set headers, but writing
// it to the log would hand anyone with log access a working session.
const REDACTED_QUERY_PARAMS = ['token']

export function redactUrl(url: string): string {
  const queryIndex = url.indexOf('?')

  if (queryIndex === -1) return url

  const params = new URLSearchParams(url.slice(queryIndex + 1))
  let redacted = false

  for (const key of REDACTED_QUERY_PARAMS) {
    if (params.has(key)) {
      params.set(key, 'redacted')
      redacted = true
    }
  }

  return redacted ? `${url.slice(0, queryIndex)}?${params.toString()}` : url
}

/**
 * Builds the app without listening, so tests can drive it through
 * `app.inject()` or an ephemeral listener.
 */
const requestSerializer = (request: { id: string; method: string; url: string; ip: string }) => ({
  id: request.id,
  method: request.method,
  url: redactUrl(request.url),
  remoteAddress: request.ip,
})

export async function buildApp(
  options: { logger?: FastifyServerOptions['logger'] } = {},
): Promise<FastifyInstance> {
  const loggerOption = options.logger ?? true
  // The serializer has to live inside the logger options: Fastify only merges
  // the top-level `serializers` shortcut when it builds the logger itself, so an
  // explicit logger object would silently bypass the redaction.
  const logger =
    typeof loggerOption === 'object'
      ? {
          ...loggerOption,
          serializers: { ...loggerOption.serializers, req: requestSerializer },
        }
      : loggerOption === false
        ? false
        : { serializers: { req: requestSerializer } }

  const app = Fastify({
    logger,
    // Honour an inbound trace id so one request is greppable end to end across
    // a proxy, otherwise mint one and log it.
    genReqId: (request) => {
      const header = request.headers['x-request-id']

      return typeof header === 'string' && header.length > 0 ? header : randomUUID()
    },
  })

  app.addHook('onSend', async (request, reply) => {
    reply.header('x-request-id', request.id)
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
  await app.register(metricsRoutes, { prefix: '/api' })

  return app
}
