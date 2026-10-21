import { count } from 'drizzle-orm'
import type { FastifyPluginAsync } from 'fastify'

import { db } from '../db/index.js'
import { researchTasks } from '../db/schema.js'
import { activeExecutionCount, isShuttingDown } from '../lib/lifecycle.js'
import { countersSnapshot, openSseConnections } from '../lib/metrics.js'

/**
 * Metrics are internal: without `METRICS_TOKEN` the route answers 404, so a
 * deployment that forgets to configure it does not expose task counts to the
 * internet. A scraper sends `Authorization: Bearer $METRICS_TOKEN`.
 */
export const metricsRoutes: FastifyPluginAsync = async (app) => {
  app.get('/metrics', async (request, reply) => {
    const token = process.env.METRICS_TOKEN

    if (!token) {
      return reply.code(404).send({ error: 'Not found' })
    }

    if (request.headers.authorization !== `Bearer ${token}`) {
      return reply.code(401).send({ error: 'Unauthorized' })
    }

    const rows = await db
      .select({ status: researchTasks.status, total: count() })
      .from(researchTasks)
      .groupBy(researchTasks.status)

    const taskStatus: Record<string, number> = {
      pending: 0,
      running: 0,
      completed: 0,
      failed: 0,
      cancelled: 0,
    }

    for (const row of rows) {
      taskStatus[row.status] = Number(row.total)
    }

    return {
      uptimeSeconds: Math.round(process.uptime()),
      shuttingDown: isShuttingDown(),
      taskStatus,
      gauges: {
        activeExecutions: activeExecutionCount(),
        openSseConnections: openSseConnections(),
      },
      counters: countersSnapshot(),
      process: {
        rssBytes: process.memoryUsage().rss,
        nodeVersion: process.version,
      },
    }
  })
}
