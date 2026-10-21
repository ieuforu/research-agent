/**
 * In-process counters. Deliberately tiny: a metric that nothing alerts on is
 * just another thing to maintain, so this tracks only what an operator would
 * actually look at while this service is a single process.
 *
 * The task-status distribution is read from Postgres at scrape time instead of
 * being counted here, so it stays correct across restarts and replica changes.
 */
interface Counters {
  tasksCreated: number
  tasksCompleted: number
  tasksFailed: number
  tasksCancelled: number
  sseConnectionsOpened: number
}

type CounterName = keyof Counters

const counters: Counters = {
  tasksCreated: 0,
  tasksCompleted: 0,
  tasksFailed: 0,
  tasksCancelled: 0,
  sseConnectionsOpened: 0,
}

let sseConnectionsOpen = 0

export function increment(name: CounterName, by = 1): void {
  counters[name] += by
}

export function sseConnectionOpened(): void {
  counters.sseConnectionsOpened += 1
  sseConnectionsOpen += 1
}

export function sseConnectionClosed(): void {
  if (sseConnectionsOpen > 0) sseConnectionsOpen -= 1
}

export function openSseConnections(): number {
  return sseConnectionsOpen
}

export function countersSnapshot(): Counters {
  return { ...counters }
}

export function resetMetricsForTests(): void {
  for (const name of Object.keys(counters) as CounterName[]) counters[name] = 0

  sseConnectionsOpen = 0
}
