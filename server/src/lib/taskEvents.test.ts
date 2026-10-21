import { beforeEach, describe, expect, it, vi } from 'vitest'
import { finish, isTerminal, publish, replay, subscribe, type ResearchEvent } from './taskEvents.js'

// Channels live in module state and are only dropped by `finish` after a TTL,
// so every test gets a fresh task id instead of sharing one.
let taskId = ''

const token = (delta: string): ResearchEvent => ({ type: 'token', delta })

beforeEach(() => {
  taskId = crypto.randomUUID()
})

describe('task event channels', () => {
  it('replays published events to late subscribers', () => {
    publish(taskId, token('a'))
    publish(taskId, token('b'))

    expect(replay(taskId).map((event) => (event.type === 'token' ? event.delta : ''))).toEqual([
      'a',
      'b',
    ])
  })

  it('delivers live events only to current subscribers', () => {
    const first = vi.fn()
    const unsubscribe = subscribe(taskId, first)

    publish(taskId, token('live'))
    unsubscribe()
    publish(taskId, token('after-unsubscribe'))

    expect(first).toHaveBeenCalledTimes(1)
    expect(first).toHaveBeenCalledWith(token('live'))
  })

  it('keeps publishing when one subscriber throws', () => {
    const broken = vi.fn(() => {
      throw new Error('boom')
    })
    const healthy = vi.fn()

    subscribe(taskId, broken)
    subscribe(taskId, healthy)

    expect(() => publish(taskId, token('resilient'))).not.toThrow()
    expect(healthy).toHaveBeenCalledWith(token('resilient'))
  })

  it('publishes the terminal event and then drops the channel', async () => {
    vi.useFakeTimers()
    const listener = vi.fn()

    subscribe(taskId, listener)
    finish(taskId, { type: 'error', message: 'failed' })

    expect(listener).toHaveBeenCalledWith({ type: 'error', message: 'failed' })

    vi.advanceTimersByTime(60_001)

    expect(replay(taskId)).toEqual([])
    vi.useRealTimers()
  })

  it('classifies terminal statuses', () => {
    expect(isTerminal('completed')).toBe(true)
    expect(isTerminal('failed')).toBe(true)
    expect(isTerminal('cancelled')).toBe(true)
    expect(isTerminal('running')).toBe(false)
    expect(isTerminal('pending')).toBe(false)
  })
})
