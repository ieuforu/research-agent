/**
 * Process lifecycle state: which executions are in flight, whether the process
 * is draining, and the handlers that must run before the server can exit.
 *
 * Kept separate from the research service so both the HTTP layer (refusing new
 * work) and the signal handler (draining existing work) can share one source of
 * truth without importing each other.
 */
const executions = new Map<string, AbortController>()
const shutdownHandlers = new Set<() => void>()

let shuttingDown = false

export function isShuttingDown(): boolean {
  return shuttingDown
}

export function registerExecution(taskId: string, controller: AbortController): void {
  executions.set(taskId, controller)
}

export function unregisterExecution(taskId: string, controller: AbortController): void {
  // Guard against a stale controller removing a newer execution for the same id.
  if (executions.get(taskId) === controller) {
    executions.delete(taskId)
  }
}

export function abortExecution(taskId: string): void {
  executions.get(taskId)?.abort()
}

export function activeExecutionCount(): number {
  return executions.size
}

export function abortAllExecutions(): number {
  const controllers = [...executions.values()]

  for (const controller of controllers) controller.abort()

  return controllers.length
}

/** Registers a cleanup step (closing an SSE stream, flushing a buffer, ...). */
export function onShutdown(handler: () => void): () => void {
  shutdownHandlers.add(handler)

  return () => shutdownHandlers.delete(handler)
}

export function runShutdownHandlers(): number {
  const handlers = [...shutdownHandlers]
  shutdownHandlers.clear()

  for (const handler of handlers) {
    try {
      handler()
    } catch {
      // One broken handler must not stop the others from running.
    }
  }

  return handlers.length
}

export function beginShutdown(): void {
  shuttingDown = true
}

/** Resolves true when every execution finished within the grace window. */
export async function waitForExecutions(timeoutMs: number, pollMs = 50): Promise<boolean> {
  const deadline = Date.now() + timeoutMs

  while (Date.now() < deadline) {
    if (executions.size === 0) return true

    await new Promise((resolve) => setTimeout(resolve, pollMs))
  }

  return executions.size === 0
}

/** Test-only: module state would otherwise leak between suites. */
export function resetLifecycleForTests(): void {
  executions.clear()
  shutdownHandlers.clear()
  shuttingDown = false
}
