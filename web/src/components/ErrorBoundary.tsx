import { Link } from '@tanstack/react-router'
import { AlertTriangle, RotateCcw } from 'lucide-react'

interface ErrorBoundaryProps {
  error: unknown
  reset?: () => void
}

export function ErrorFallback({ error, reset }: ErrorBoundaryProps) {
  const message = error instanceof Error ? error.message : typeof error === 'string' ? error : ''
  const stack = error instanceof Error ? error.stack : undefined

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10">
        <AlertTriangle className="h-6 w-6 text-red-500" />
      </div>
      <h1 className="mt-5 text-[20px] font-semibold">Something went wrong</h1>
      <p className="mt-2 max-w-md text-[14px] leading-relaxed text-muted-foreground">
        {message || 'An unexpected error occurred.'}
      </p>
      <div className="mt-6 flex gap-3">
        {reset && (
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-lg border border-border/60 px-4 py-2 text-[13px] font-medium transition-colors hover:bg-muted/50"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Try again
          </button>
        )}
        <Link
          to="/"
          className="rounded-lg bg-foreground px-4 py-2 text-[13px] font-medium text-background transition-all hover:opacity-90"
        >
          Go home
        </Link>
      </div>
      {import.meta.env.DEV && stack && (
        <pre className="mt-8 max-w-lg overflow-auto rounded-lg bg-muted/50 p-4 text-left text-[11px] text-muted-foreground">
          {stack}
        </pre>
      )}
    </div>
  )
}
