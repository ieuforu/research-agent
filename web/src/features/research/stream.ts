import { apiUrl } from '#/lib/http.ts'
import type { ResearchSource, ResearchStatus, ResearchTask } from './types'

export interface ResearchStreamHandlers {
  onStatus?: (status: ResearchStatus) => void
  onSources?: (sources: ResearchSource[]) => void
  onToken?: (delta: string) => void
  onDone?: (task: ResearchTask) => void
  onError?: (message: string) => void
}

type ServerEvent =
  | { type: 'status'; status: ResearchStatus }
  | { type: 'sources'; sources: ResearchSource[] }
  | { type: 'token'; delta: string }
  | { type: 'done'; task: ResearchTask }
  | { type: 'error'; message: string }

function parse<T>(event: MessageEvent<string>, validate: (value: unknown) => value is T): T | null {
  try {
    const value: unknown = JSON.parse(event.data)

    return validate(value) ? value : null
  } catch {
    return null
  }
}

function isServerEvent(value: unknown): value is ServerEvent {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    typeof (value as { type: unknown }).type === 'string'
  )
}

/**
 * Subscribes to `GET /api/research/:id/stream`.
 *
 * EventSource reconnects automatically, so the returned `close` MUST be called
 * once a terminal event arrives — otherwise the client would reconnect after
 * the server ends the stream and replay the task forever.
 */
export function openResearchStream(taskId: string, handlers: ResearchStreamHandlers): () => void {
  if (typeof EventSource === 'undefined') {
    handlers.onError?.('当前环境不支持 EventSource')

    return () => {}
  }

  const source = new EventSource(apiUrl(`/research/${taskId}/stream`))
  let closed = false

  const close = () => {
    if (closed) return

    closed = true
    source.close()
  }

  source.addEventListener('status', (event) => {
    const parsed = parse(event as MessageEvent<string>, isServerEvent)

    if (parsed?.type === 'status') handlers.onStatus?.(parsed.status)
  })

  source.addEventListener('sources', (event) => {
    const parsed = parse(event as MessageEvent<string>, isServerEvent)

    if (parsed?.type === 'sources') handlers.onSources?.(parsed.sources)
  })

  source.addEventListener('token', (event) => {
    const parsed = parse(event as MessageEvent<string>, isServerEvent)

    if (parsed?.type === 'token') handlers.onToken?.(parsed.delta)
  })

  source.addEventListener('done', (event) => {
    const parsed = parse(event as MessageEvent<string>, isServerEvent)

    close()

    if (parsed?.type === 'done') handlers.onDone?.(parsed.task)
  })

  source.addEventListener('error', (event) => {
    const parsed = parse(event as MessageEvent<string>, isServerEvent)

    close()

    handlers.onError?.(parsed?.type === 'error' ? parsed.message : '流式连接中断')
  })

  return close
}
