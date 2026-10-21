import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { openResearchStream } from './stream'
import type { ResearchTask } from './types'

type Listener = (event: MessageEvent<string>) => void

class FakeEventSource {
  static instances: FakeEventSource[] = []

  url: string
  closed = false
  private listeners = new Map<string, Set<Listener>>()

  constructor(url: string) {
    this.url = url
    FakeEventSource.instances.push(this)
  }

  addEventListener(type: string, listener: Listener) {
    const set = this.listeners.get(type) ?? new Set<Listener>()
    set.add(listener)
    this.listeners.set(type, set)
  }

  close() {
    this.closed = true
  }

  emit(type: string, payload: unknown) {
    const data = typeof payload === 'string' ? payload : JSON.stringify(payload)

    for (const listener of this.listeners.get(type) ?? []) {
      listener({ data } as MessageEvent<string>)
    }
  }
}

const task: ResearchTask = {
  id: '11111111-1111-4111-8111-111111111111',
  question: 'what is mvcc',
  status: 'completed',
  error: null,
  createdAt: '2026-10-21T02:00:00.000Z',
  updatedAt: '2026-10-21T02:00:05.000Z',
  report: 'mvcc is ...',
  sources: [{ title: 'A', url: 'https://example.com/a', snippet: 's' }],
}

function lastSource(): FakeEventSource {
  const source = FakeEventSource.instances.at(-1)
  if (!source) throw new Error('no EventSource created')

  return source
}

beforeEach(() => {
  FakeEventSource.instances = []
  vi.stubGlobal('EventSource', FakeEventSource)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('openResearchStream', () => {
  it('subscribes to the task stream endpoint', () => {
    const close = openResearchStream(task.id, {})

    expect(lastSource().url).toBe(`/api/research/${task.id}/stream`)
    close()
  })

  it('appends the session token as a query parameter for EventSource', () => {
    window.localStorage.setItem('auth_token', 'jwt-abc')
    const close = openResearchStream(task.id, {})

    expect(lastSource().url).toBe(`/api/research/${task.id}/stream?token=jwt-abc`)
    close()
    window.localStorage.clear()
  })

  it('encodes a token containing reserved characters', () => {
    window.localStorage.setItem('auth_token', 'a+b/c==')
    const close = openResearchStream(task.id, {})

    expect(lastSource().url).toContain('?token=a%2Bb%2Fc%3D%3D')
    close()
    window.localStorage.clear()
  })

  it('dispatches status, sources, token and done events', () => {
    const handlers = {
      onStatus: vi.fn(),
      onSources: vi.fn(),
      onToken: vi.fn(),
      onDone: vi.fn(),
      onError: vi.fn(),
    }

    openResearchStream(task.id, handlers)
    const source = lastSource()

    source.emit('status', { type: 'status', status: 'running' })
    source.emit('sources', { type: 'sources', sources: task.sources })
    source.emit('token', { type: 'token', delta: 'mv' })
    source.emit('token', { type: 'token', delta: 'cc' })
    source.emit('done', { type: 'done', task })

    expect(handlers.onStatus).toHaveBeenCalledWith('running')
    expect(handlers.onSources).toHaveBeenCalledWith(task.sources)
    expect(handlers.onToken.mock.calls).toEqual([['mv'], ['cc']])
    expect(handlers.onDone).toHaveBeenCalledWith(task)
    expect(handlers.onError).not.toHaveBeenCalled()
  })

  it('closes the connection on a terminal event so EventSource cannot reconnect', () => {
    openResearchStream(task.id, {})
    const source = lastSource()

    source.emit('done', { type: 'done', task })

    expect(source.closed).toBe(true)
  })

  it('surfaces server error events and closes', () => {
    const onError = vi.fn()

    openResearchStream(task.id, { onError })
    const source = lastSource()

    source.emit('error', { type: 'error', message: 'upstream failed' })

    expect(onError).toHaveBeenCalledWith('upstream failed')
    expect(source.closed).toBe(true)
  })

  it('ignores malformed payloads', () => {
    const onToken = vi.fn()

    openResearchStream(task.id, { onToken })
    lastSource().emit('token', 'not json')

    expect(onToken).not.toHaveBeenCalled()
  })

  it('reports unsupported environments instead of throwing', () => {
    vi.stubGlobal('EventSource', undefined)
    const onError = vi.fn()

    const close = openResearchStream(task.id, { onError })

    expect(onError).toHaveBeenCalledWith('当前环境不支持 EventSource')
    expect(() => close()).not.toThrow()
  })
})
