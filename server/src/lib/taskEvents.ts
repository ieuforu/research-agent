import type { researchTasks } from '../db/schema.js'

export type ResearchTaskRow = typeof researchTasks.$inferSelect
export type ResearchStatus = ResearchTaskRow['status']
export type ResearchSource = NonNullable<ResearchTaskRow['sources']>[number]

/**
 * Wire format for `GET /api/research/:id/stream`. Keep the SSE `event:` name
 * equal to `type` so clients can add listeners per event.
 */
export type ResearchEvent =
  | { type: 'status'; status: ResearchStatus }
  | { type: 'sources'; sources: ResearchSource[] }
  | { type: 'token'; delta: string }
  | { type: 'done'; task: ResearchTaskRow }
  | { type: 'error'; message: string }

const TERMINAL: ResearchStatus[] = ['completed', 'failed', 'cancelled']

// A single long report produces many token events; cap the replay buffer so a
// task left open in a browser tab cannot grow memory without bound. Late
// subscribers still receive the complete report in the terminal `done` event.
const MAX_HISTORY = 4_000

interface Channel {
  history: ResearchEvent[]
  subscribers: Set<(event: ResearchEvent) => void>
}

const channels = new Map<string, Channel>()

function ensureChannel(taskId: string): Channel {
  const existing = channels.get(taskId)

  if (existing) return existing

  const channel: Channel = { history: [], subscribers: new Set() }
  channels.set(taskId, channel)

  return channel
}

export function publish(taskId: string, event: ResearchEvent): void {
  const channel = ensureChannel(taskId)

  if (channel.history.length < MAX_HISTORY) {
    channel.history.push(event)
  }

  for (const subscriber of channel.subscribers) {
    try {
      subscriber(event)
    } catch {
      // A broken subscriber must not abort task execution.
    }
  }
}

export function subscribe(taskId: string, listener: (event: ResearchEvent) => void): () => void {
  const channel = ensureChannel(taskId)
  channel.subscribers.add(listener)

  return () => channel.subscribers.delete(listener)
}

export function replay(taskId: string): ResearchEvent[] {
  return channels.get(taskId)?.history.slice() ?? []
}

export function isTerminal(status: ResearchStatus): boolean {
  return TERMINAL.includes(status)
}

/** Publishes the terminal event and drops the channel after a short grace period. */
export function finish(taskId: string, event: ResearchEvent, ttlMs = 60_000): void {
  publish(taskId, event)

  const channel = channels.get(taskId)

  if (channel) {
    channel.subscribers.clear()
  }

  setTimeout(() => channels.delete(taskId), ttlMs).unref?.()
}
