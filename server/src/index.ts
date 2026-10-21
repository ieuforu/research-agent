import { buildApp } from './app.js'
import {
  abortAllExecutions,
  activeExecutionCount,
  beginShutdown,
  runShutdownHandlers,
  waitForExecutions,
} from './lib/lifecycle.js'
import { pool } from './db/index.js'
import { recoverInterruptedTasks } from './services/research.js'

const app = await buildApp()

const port = Number(process.env.PORT ?? 3000)
const shutdownGraceMs = Number(process.env.SHUTDOWN_GRACE_MS ?? 10_000)

// Execution lives in this process, so any `running` row found at boot is stale.
const recovered = await recoverInterruptedTasks()

if (recovered > 0) {
  app.log.warn({ count: recovered }, 'Marked interrupted research tasks as failed')
}

let draining = false

async function shutdown(signal: string): Promise<void> {
  if (draining) return

  draining = true
  beginShutdown()

  const startedAt = Date.now()

  app.log.info(
    { signal, activeExecutions: activeExecutionCount() },
    'shutting down: refusing new work',
  )

  // 1. End SSE streams (hijacked responses are invisible to app.close()).
  const closedStreams = runShutdownHandlers()

  // 2. Stop accepting connections and wait for in-flight requests.
  const closed = app.close()

  // 3. Give running tasks a bounded window to finish, then abort what is left.
  const drained = await waitForExecutions(shutdownGraceMs)
  const aborted = drained ? 0 : abortAllExecutions()

  if (!drained) {
    app.log.warn({ aborted }, 'grace window expired, aborted running tasks')
  }

  await closed
  await pool.end()

  app.log.info({ ms: Date.now() - startedAt, closedStreams, aborted }, 'shutdown complete')
}

for (const signal of ['SIGTERM', 'SIGINT'] as const) {
  process.once(signal, () => {
    void shutdown(signal).then(() => process.exit(0))
  })
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
