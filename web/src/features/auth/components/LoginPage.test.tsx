import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LoginPage } from './LoginPage'

const http = vi.hoisted(() => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
}))

vi.mock('#/lib/http.ts', () => ({
  apiUrl: (path: string) => `/api${path}`,
  ...http,
}))

const navigate = vi.hoisted(() => vi.fn())

// The page only needs a navigate function and a link; mocking the router keeps
// this a component test instead of a routing test.
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigate,
  Link: ({ children, to }: { children: ReactNode; to: string }) => <a href={to}>{children}</a>,
}))

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })

  render(
    <QueryClientProvider client={queryClient}>
      <LoginPage />
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  window.localStorage.clear()
})

describe('LoginPage', () => {
  it('stores the token and navigates to the workbench on success', async () => {
    http.apiPost.mockResolvedValue({
      token: 'jwt-abc',
      user: { id: 'u1', email: 'a@example.com', createdAt: '2026-10-21T00:00:00.000Z' },
    })

    renderPage()

    await userEvent.type(screen.getByLabelText('Email'), 'a@example.com')
    await userEvent.type(screen.getByLabelText('Password'), 'password123')
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    await waitFor(() => expect(window.localStorage.getItem('auth_token')).toBe('jwt-abc'))
    expect(navigate).toHaveBeenCalledWith({ to: '/research' })
    expect(http.apiPost).toHaveBeenCalledWith('auth/login', {
      json: { email: 'a@example.com', password: 'password123' },
    })
  })

  it('shows the server error and keeps the user on the page', async () => {
    http.apiPost.mockRejectedValue(new Error('Invalid email or password'))

    renderPage()

    await userEvent.type(screen.getByLabelText('Email'), 'a@example.com')
    await userEvent.type(screen.getByLabelText('Password'), 'wrong password')
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByText('Invalid email or password')).toBeInTheDocument()
    expect(window.localStorage.getItem('auth_token')).toBeNull()
    expect(navigate).not.toHaveBeenCalled()
  })
})
