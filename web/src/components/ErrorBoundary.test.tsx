import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ErrorFallback } from './ErrorBoundary'

// Mock TanStack Router's Link — just renders an <a> in tests
vi.mock('@tanstack/react-router', () => ({
  Link: ({
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { children: React.ReactNode }) => (
    <a {...props}>{children}</a>
  ),
}))

describe('ErrorFallback', () => {
  it('renders error message', () => {
    render(<ErrorFallback error={new Error('Something broke')} />)
    expect(screen.getByText('Something broke')).toBeInTheDocument()
  })

  it('renders default message when error has no message', () => {
    render(<ErrorFallback error={new Error()} />)
    expect(screen.getByText('An unexpected error occurred.')).toBeInTheDocument()
  })

  it('renders a thrown string without a stack trace', () => {
    render(<ErrorFallback error="Something broke" />)
    expect(screen.getByText('Something broke')).toBeInTheDocument()
    expect(document.querySelector('pre')).not.toBeInTheDocument()
  })

  it.each([null, undefined, 42, { message: 'Not an Error instance' }])(
    'renders a fallback for an unknown thrown value (%#)',
    (error) => {
      render(<ErrorFallback error={error} />)
      expect(screen.getByText('An unexpected error occurred.')).toBeInTheDocument()
      expect(document.querySelector('pre')).not.toBeInTheDocument()
    },
  )

  it('shows try again button when reset is provided', () => {
    render(<ErrorFallback error={new Error('Oops')} reset={() => {}} />)
    expect(screen.getByText('Try again')).toBeInTheDocument()
  })

  it('calls reset when try again is clicked', async () => {
    const reset = vi.fn()
    const user = userEvent.setup()
    render(<ErrorFallback error={new Error('Oops')} reset={reset} />)
    await user.click(screen.getByText('Try again'))
    expect(reset).toHaveBeenCalledOnce()
  })

  it('does not show try again when reset is not provided', () => {
    render(<ErrorFallback error={new Error('Oops')} />)
    expect(screen.queryByText('Try again')).not.toBeInTheDocument()
  })

  it('shows go home link', () => {
    render(<ErrorFallback error={new Error('Oops')} />)
    expect(screen.getByText('Go home')).toBeInTheDocument()
  })

  it('shows stack trace in dev mode', () => {
    render(<ErrorFallback error={new Error('Test error')} />)
    // The pre element with stack trace should be present in dev
    const pre = document.querySelector('pre')
    expect(pre).toBeInTheDocument()
  })
})
