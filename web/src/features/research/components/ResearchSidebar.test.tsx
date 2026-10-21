import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ResearchSidebar } from './ResearchSidebar'
import type { ResearchTaskSummary } from '../types'

const http = vi.hoisted(() => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
}))

vi.mock('#/lib/http.ts', () => ({
  apiUrl: (path: string) => `/api${path}`,
  ...http,
}))

const completed: ResearchTaskSummary = {
  id: '11111111-1111-4111-8111-111111111111',
  question: '分析 React Server Components 的优势与局限',
  status: 'completed',
  error: null,
  createdAt: new Date(Date.now() - 5 * 60_000).toISOString(),
  updatedAt: new Date(Date.now() - 4 * 60_000).toISOString(),
}

const created: ResearchTaskSummary = {
  ...completed,
  id: '22222222-2222-4222-8222-222222222222',
  question: 'new question',
  status: 'pending',
}

function renderSidebar(props: Partial<Parameters<typeof ResearchSidebar>[0]> = {}) {
  const handlers = {
    onSelect: vi.fn(),
    onCreated: vi.fn(),
    onStatusChange: vi.fn(),
    ...props,
  }

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  })

  render(
    <QueryClientProvider client={queryClient}>
      <ResearchSidebar {...handlers} />
    </QueryClientProvider>,
  )

  return handlers
}

beforeEach(() => {
  vi.clearAllMocks()
  http.apiGet.mockResolvedValue({ tasks: [completed], nextCursor: null })
})

describe('ResearchSidebar', () => {
  it('lists tasks with a relative timestamp and status', async () => {
    renderSidebar()

    const row = await screen.findByRole('button', { name: new RegExp(completed.question) })

    expect(within(row).getByText('已完成')).toBeInTheDocument()
    expect(within(row).getByText(/分钟前/)).toBeInTheDocument()
    expect(http.apiGet).toHaveBeenCalledWith('research?limit=20')
  })

  it('marks the active task', async () => {
    renderSidebar({ activeTaskId: completed.id })

    const row = await screen.findByRole('button', { name: new RegExp(completed.question) })

    expect(row).toHaveAttribute('aria-current', 'true')
  })

  it('opens a task when its row is clicked', async () => {
    const { onSelect } = renderSidebar()

    await userEvent.click(
      await screen.findByRole('button', { name: new RegExp(completed.question) }),
    )

    expect(onSelect).toHaveBeenCalledWith(completed.id)
  })

  it('shows an empty state', async () => {
    http.apiGet.mockResolvedValue({ tasks: [], nextCursor: null })

    renderSidebar()

    expect(await screen.findByText('还没有研究任务')).toBeInTheDocument()
  })

  it('submits a trimmed question and follows the new task', async () => {
    http.apiPost.mockResolvedValue({ task: created })
    const { onCreated } = renderSidebar()

    const textarea = await screen.findByLabelText('研究问题')
    await userEvent.type(textarea, '  new question  ')
    await userEvent.click(screen.getByRole('button', { name: /开始/ }))

    await waitFor(() => {
      expect(http.apiPost).toHaveBeenCalledWith('research', { json: { question: 'new question' } })
    })
    await waitFor(() => expect(onCreated).toHaveBeenCalledWith(created.id))
  })

  it('submits with Cmd/Ctrl + Enter', async () => {
    http.apiPost.mockResolvedValue({ task: created })
    const { onCreated } = renderSidebar()

    const textarea = await screen.findByLabelText('研究问题')
    await userEvent.type(textarea, 'shortcut question{Control>}{Enter}{/Control}')

    await waitFor(() => expect(onCreated).toHaveBeenCalledWith(created.id))
  })

  it('forwards filter changes', async () => {
    const { onStatusChange } = renderSidebar()

    await userEvent.click(await screen.findByRole('button', { name: '失败' }))

    expect(onStatusChange).toHaveBeenCalledWith('failed')
  })
})
