import { beforeEach, describe, expect, it, vi } from 'vitest'
import { cancelResearch, createResearch, fetchResearchList, fetchResearchTask } from './api'
import type { ResearchTask, ResearchTaskSummary } from './types'

const http = vi.hoisted(() => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
}))

vi.mock('#/lib/http.ts', () => ({
  apiUrl: (path: string) => `/api${path}`,
  ...http,
}))

const summary: ResearchTaskSummary = {
  id: '11111111-1111-4111-8111-111111111111',
  question: 'what is mvcc',
  status: 'completed',
  error: null,
  createdAt: '2026-10-21T02:00:00.000Z',
  updatedAt: '2026-10-21T02:00:05.000Z',
}

const task: ResearchTask = { ...summary, report: 'mvcc is ...', sources: null }

beforeEach(() => {
  vi.clearAllMocks()
})

describe('fetchResearchList', () => {
  it('omits empty query parameters', async () => {
    http.apiGet.mockResolvedValue({ tasks: [summary], nextCursor: null })

    await expect(fetchResearchList()).resolves.toEqual({ tasks: [summary], nextCursor: null })
    expect(http.apiGet).toHaveBeenCalledWith('research')
  })

  it('serialises limit, cursor and status', async () => {
    http.apiGet.mockResolvedValue({ tasks: [], nextCursor: null })

    await fetchResearchList({ limit: 20, cursor: 'next-page', status: 'running' })

    expect(http.apiGet).toHaveBeenCalledWith('research?limit=20&cursor=next-page&status=running')
  })

  it('falls back to an empty page when the response body is empty', async () => {
    http.apiGet.mockResolvedValue(undefined)

    await expect(fetchResearchList()).resolves.toEqual({ tasks: [], nextCursor: null })
  })
})

describe('fetchResearchTask', () => {
  it('unwraps the task envelope', async () => {
    http.apiGet.mockResolvedValue({ task })

    await expect(fetchResearchTask(summary.id)).resolves.toEqual(task)
    expect(http.apiGet).toHaveBeenCalledWith(`research/${summary.id}`)
  })

  it('throws when the envelope is missing', async () => {
    http.apiGet.mockResolvedValue(undefined)

    await expect(fetchResearchTask(summary.id)).rejects.toThrow('Research task not found')
  })
})

describe('createResearch', () => {
  it('posts the question as JSON', async () => {
    http.apiPost.mockResolvedValue({ task: summary })

    await expect(createResearch('what is mvcc')).resolves.toEqual(summary)
    expect(http.apiPost).toHaveBeenCalledWith('research', { json: { question: 'what is mvcc' } })
  })
})

describe('cancelResearch', () => {
  it('posts to the cancel endpoint', async () => {
    http.apiPost.mockResolvedValue({ task: { ...summary, status: 'cancelled' } })

    await expect(cancelResearch(summary.id)).resolves.toMatchObject({ status: 'cancelled' })
    expect(http.apiPost).toHaveBeenCalledWith(`research/${summary.id}/cancel`)
  })
})
