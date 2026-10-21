import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ResearchDetailPage } from './ResearchDetailPage'
import type { ResearchTask } from '../types'

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
    for (const listener of this.listeners.get(type) ?? []) {
      listener({ data: JSON.stringify(payload) } as MessageEvent<string>)
    }
  }
}

const http = vi.hoisted(() => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
}))

vi.mock('#/lib/http.ts', () => ({
  apiUrl: (path: string) => `/api${path}`,
  ...http,
}))

const runningTask: ResearchTask = {
  id: '11111111-1111-4111-8111-111111111111',
  question: 'PostgreSQL 的 MVCC 是怎么实现的？',
  status: 'running',
  error: null,
  createdAt: '2026-10-21T02:00:00.000Z',
  updatedAt: '2026-10-21T02:00:01.000Z',
  report: null,
  sources: null,
}

const completedTask: ResearchTask = {
  ...runningTask,
  status: 'completed',
  report: 'MVCC 通过多版本实现读写不阻塞 [1]。',
  sources: [{ title: '检索结果 A', url: 'https://example.com/a', snippet: 'A 的摘要' }],
}

function renderPage(task: ResearchTask, onBack = vi.fn()) {
  http.apiGet.mockResolvedValue({ task })

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  })

  render(
    <QueryClientProvider client={queryClient}>
      <ResearchDetailPage taskId={task.id} onBack={onBack} />
    </QueryClientProvider>,
  )

  return { onBack }
}

beforeEach(() => {
  FakeEventSource.instances = []
  vi.clearAllMocks()
  vi.stubGlobal('EventSource', FakeEventSource)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('ResearchDetailPage', () => {
  it('renders a finished report with numbered sources', async () => {
    renderPage(completedTask)

    expect(await screen.findByText(completedTask.report as string)).toBeInTheDocument()
    expect(screen.getByText(/来源（1）/)).toBeInTheDocument()
    expect(screen.getByText('[1] 检索结果 A')).toBeInTheDocument()
    // Finished tasks must not open a stream.
    expect(FakeEventSource.instances).toHaveLength(0)
  })

  it('streams tokens into the report while the task is active', async () => {
    renderPage(runningTask)

    await waitFor(() => expect(FakeEventSource.instances).toHaveLength(1))

    const source = FakeEventSource.instances[0]
    expect(source.url).toBe(`/api/research/${runningTask.id}/stream`)

    source.emit('sources', {
      type: 'sources',
      sources: [{ title: '实时来源', url: 'https://example.com/live', snippet: 'live' }],
    })
    source.emit('token', { type: 'token', delta: 'MVCC ' })
    source.emit('token', { type: 'token', delta: '通过多版本' })

    expect(await screen.findByText('MVCC 通过多版本')).toBeInTheDocument()
    expect(screen.getByText('[1] 实时来源')).toBeInTheDocument()
    expect(screen.getByText('研究报告（生成中）')).toBeInTheDocument()

    source.emit('done', { type: 'done', task: completedTask })

    await waitFor(() => expect(source.closed).toBe(true))
  })

  it('cancels an active task through the cancel endpoint', async () => {
    http.apiPost.mockResolvedValue({ task: { ...runningTask, status: 'cancelled' } })
    renderPage(runningTask)

    const cancelButton = await screen.findByRole('button', { name: /取消任务/ })
    await userEvent.click(cancelButton)

    await waitFor(() => {
      expect(http.apiPost).toHaveBeenCalledWith(`research/${runningTask.id}/cancel`)
    })
  })

  it('falls back to polling when EventSource is unavailable', async () => {
    vi.stubGlobal('EventSource', undefined)
    renderPage(runningTask)

    expect(await screen.findByText(/实时流已断开/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /取消任务/ })).toBeInTheDocument()
  })

  it('shows the failure reason for a failed task', async () => {
    renderPage({ ...runningTask, status: 'failed', error: 'Tavily search failed with HTTP 500' })

    expect(await screen.findByText('执行失败')).toBeInTheDocument()
    expect(screen.getByText('Tavily search failed with HTTP 500')).toBeInTheDocument()
  })
})
