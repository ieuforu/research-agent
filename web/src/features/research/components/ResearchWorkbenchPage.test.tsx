import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ResearchWorkbenchPage } from './ResearchWorkbenchPage'
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
  createdAt: '2026-10-21T02:00:00.000Z',
  updatedAt: '2026-10-21T02:00:05.000Z',
}

const created: ResearchTaskSummary = {
  id: '22222222-2222-4222-8222-222222222222',
  question: 'new question',
  status: 'pending',
  error: null,
  createdAt: '2026-10-21T03:00:00.000Z',
  updatedAt: '2026-10-21T03:00:00.000Z',
}

function renderPage(onSelect = vi.fn()) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  })

  render(
    <QueryClientProvider client={queryClient}>
      <ResearchWorkbenchPage onSelect={onSelect} />
    </QueryClientProvider>,
  )

  return { onSelect }
}

beforeEach(() => {
  vi.clearAllMocks()
  http.apiGet.mockResolvedValue({ tasks: [completed], nextCursor: null })
})

describe('ResearchWorkbenchPage', () => {
  it('renders tasks returned by the list endpoint', async () => {
    renderPage()

    expect(await screen.findByText(completed.question)).toBeInTheDocument()

    // The filter bar also renders a "已完成" label, so scope the assertion to the row.
    const row = screen.getByRole('button', { name: new RegExp(completed.question) })
    expect(within(row).getByText('已完成')).toBeInTheDocument()
    expect(http.apiGet).toHaveBeenCalledWith('research?limit=20')
  })

  it('opens a task when its row is clicked', async () => {
    const { onSelect } = renderPage()

    await userEvent.click(await screen.findByText(completed.question))

    expect(onSelect).toHaveBeenCalledWith(completed.id)
  })

  it('shows an empty state when there are no tasks', async () => {
    http.apiGet.mockResolvedValue({ tasks: [], nextCursor: null })

    renderPage()

    expect(await screen.findByText('还没有研究任务')).toBeInTheDocument()
  })

  it('submits a trimmed question and follows the new task', async () => {
    http.apiPost.mockResolvedValue({ task: created })
    const { onSelect } = renderPage()

    const textarea = await screen.findByLabelText('研究问题')
    await userEvent.type(textarea, '  new question  ')
    await userEvent.click(screen.getByRole('button', { name: /开始研究/ }))

    await waitFor(() => {
      expect(http.apiPost).toHaveBeenCalledWith('research', { json: { question: 'new question' } })
    })
    await waitFor(() => expect(onSelect).toHaveBeenCalledWith(created.id))
  })

  it('keeps the submit button disabled for a blank question', async () => {
    renderPage()

    const button = await screen.findByRole('button', { name: /开始研究/ })

    expect(button).toBeDisabled()
  })
})
