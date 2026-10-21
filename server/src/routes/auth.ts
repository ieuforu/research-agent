import { eq } from 'drizzle-orm'
import { z } from 'zod'
import type { FastifyPluginAsync } from 'fastify'

import { db } from '../db/index.js'
import { users } from '../db/schema.js'
import { isUniqueViolation } from '../lib/db-errors.js'
import { hashPassword, verifyPassword } from '../lib/password.js'

const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(320),
  password: z.string().min(8).max(200),
})

interface PublicUser {
  id: string
  email: string
  createdAt: string
}

function toPublicUser(row: typeof users.$inferSelect): PublicUser {
  return { id: row.id, email: row.email, createdAt: row.createdAt.toISOString() }
}

export const authRoutes: FastifyPluginAsync = async (app) => {
  app.post('/auth/register', async (request, reply) => {
    const parsed = credentialsSchema.safeParse(request.body)

    if (!parsed.success) {
      return reply.code(400).send({ error: 'Invalid request', details: parsed.error.issues })
    }

    const { email, password } = parsed.data
    const passwordHash = await hashPassword(password)

    try {
      const [user] = await db.insert(users).values({ email, passwordHash }).returning()

      const token = app.jwt.sign({ sub: user.id, email: user.email })

      return reply.code(201).send({ token, user: toPublicUser(user) })
    } catch (error) {
      if (isUniqueViolation(error)) {
        return reply.code(409).send({ error: 'Email is already registered' })
      }

      throw error
    }
  })

  app.post('/auth/login', async (request, reply) => {
    const parsed = credentialsSchema.safeParse(request.body)

    if (!parsed.success) {
      return reply.code(400).send({ error: 'Invalid request', details: parsed.error.issues })
    }

    const [user] = await db.select().from(users).where(eq(users.email, parsed.data.email)).limit(1)

    // Same response for unknown email and wrong password: never reveal which
    // accounts exist.
    if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
      return reply.code(401).send({ error: 'Invalid email or password' })
    }

    const token = app.jwt.sign({ sub: user.id, email: user.email })

    return { token, user: toPublicUser(user) }
  })

  app.get('/auth/me', { onRequest: [app.authenticate] }, async (request, reply) => {
    const [user] = await db.select().from(users).where(eq(users.id, request.user.sub)).limit(1)

    if (!user) {
      return reply.code(401).send({ error: 'Unauthorized' })
    }

    return { user: toPublicUser(user) }
  })
}
