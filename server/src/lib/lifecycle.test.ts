import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  abortAllExecutions,
  abortExecution,
  activeExecutionCount,
  beginShutdown,
  isShuttingDown,
  onShutdown,
  registerExecution,
  resetLifecycleForTests,
  runShutdownHandlers,
  unregisterExecution,
  waitForExecutions,
} from './lifecycle.js'

beforeEach(() => {
  resetLifecycleForTests()
})

describe('execution registry', () => {
  it('tracks and untracks in-flight executions', () => {
    const controller = new AbortController()

    registerExecution('task-1', controller)
    expect(activeExecutionCount()).toBe(1)

    unregisterExecution('task-1', controller)
    expect(activeExecutionCount()).toBe(0)
  })

  it('ignores an unregister from a stale controller', () => {
    const first = new AbortController()
    const second = new AbortController()

    registerExecution('task-1', first)
    registerExecution('task-1', second)
    unregisterExecution('task-1', first)

    expect(activeExecutionCount()).toBe(1)
    abortExecution('task-1')

    expect(second.signal.aborted).toBe(true)
    expect(first.signal.aborted).toBe(false)
  })

  it('aborts every execution on demand', () => {
    const a = new AbortController()
    const b = new AbortController()

    registerExecution('a', a)
    registerExecution('b', b)

    expect(abortAllExecutions()).toBe(2)
    expect(a.signal.aborted).toBe(true)
    expect(b.signal.aborted).toBe(true)
  })

  it('resolves immediately when nothing is in flight', async () => {
    await expect(waitForExecutions(50)).resolves.toBe(true)
  })

  it('resolves once the last execution finished', async () => {
    const controller = new AbortController()

    registerExecution('task-1', controller)
    setTimeout(() => unregisterExecution('task-1', controller), 20)

    await expect(waitForExecutions(500, 10)).resolves.toBe(true)
  })

  it('gives up after the grace window', async () => {
    registerExecution('task-1', new AbortController())

    await expect(waitForExecutions(40, 10)).resolves.toBe(false)
  })
})

describe('shutdown handling', () => {
  it('flags the process as shutting down', () => {
    expect(isShuttingDown()).toBe(false)

    beginShutdown()

    expect(isShuttingDown()).toBe(true)
  })

  it('runs registered handlers once and supports unsubscribing', () => {
    const handler = vi.fn()
    const unregister = onShutdown(handler)

    expect(runShutdownHandlers()).toBe(1)
    expect(handler).toHaveBeenCalledTimes(1)

    // Second drain has no handlers left.
    expect(runShutdownHandlers()).toBe(0)

    onShutdown(vi.fn())
    unregister()
    expect(runShutdownHandlers()).toBe(1)
  })

  it('keeps going when one handler throws', () => {
    const healthy = vi.fn()

    onShutdown(() => {
      throw new Error('boom')
    })
    onShutdown(healthy)

    expect(() => runShutdownHandlers()).not.toThrow()
    expect(healthy).toHaveBeenCalledTimes(1)
  })
})
