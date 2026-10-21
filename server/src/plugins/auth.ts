import fastifyJwt from '@fastify/jwt'
import fp from 'fastify-plugin'
import type { FastifyReply, FastifyRequest } from 'fastify'

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { sub: string; email: string }
    user: { sub: string; email: string }
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
}

function queryToken(request: FastifyRequest): string | undefined {
  const { token } = request.query as { token?: unknown }

  return typeof token === 'string' && token.length > 0 ? token : undefined
}

/**
 * Registers JWT support and one `authenticate` hook used by every protected
 * route.
 *
 * `EventSource` cannot set an Authorization header, so the SSE endpoint may
 * pass the token as `?token=`. That is scoped to `/stream` on purpose: query
 * strings end up in access logs and Referer headers, so accepting them on every
 * endpoint would leak tokens unnecessarily.
 */
export default fp(
  async (app) => {
    const secret = process.env.JWT_SECRET

    if (!secret) {
      throw new Error('JWT_SECRET is not configured')
    }

    await app.register(fastifyJwt, {
      secret,
      sign: { expiresIn: process.env.JWT_EXPIRES_IN ?? '7d' },
    })

    app.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
      const token = queryToken(request)
      const isStream = request.url.split('?')[0]?.endsWith('/stream') ?? false

      if (token && isStream) {
        try {
          request.user = app.jwt.verify(token)

          return
        } catch {
          return reply.code(401).send({ error: 'Unauthorized' })
        }
      }

      try {
        await request.jwtVerify()
      } catch {
        return reply.code(401).send({ error: 'Unauthorized' })
      }
    })
  },
  { name: 'auth' },
)
