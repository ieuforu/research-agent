import { beforeEach, describe, expect, it } from 'vitest'
import {
  countersSnapshot,
  increment,
  openSseConnections,
  resetMetricsForTests,
  sseConnectionClosed,
  sseConnectionOpened,
} from './metrics.js'

beforeEach(() => {
  resetMetricsForTests()
})

describe('metrics', () => {
  it('counts task outcomes', () => {
    increment('tasksCreated')
    increment('tasksCreated')
    increment('tasksCompleted')

    expect(countersSnapshot()).toMatchObject({
      tasksCreated: 2,
      tasksCompleted: 1,
      tasksFailed: 0,
    })
  })

  it('tracks open SSE connections', () => {
    sseConnectionOpened()
    sseConnectionOpened()

    expect(openSseConnections()).toBe(2)

    sseConnectionClosed()

    expect(openSseConnections()).toBe(1)
    expect(countersSnapshot().sseConnectionsOpened).toBe(2)
  })

  it('never reports negative open connections', () => {
    sseConnectionClosed()

    expect(openSseConnections()).toBe(0)
  })

  it('returns a copy, so callers cannot mutate the registry', () => {
    const snapshot = countersSnapshot()

    snapshot.tasksCreated = 99

    expect(countersSnapshot().tasksCreated).toBe(0)
  })
})
