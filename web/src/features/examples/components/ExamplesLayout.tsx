import { Link, Outlet } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'

const examples = [
  { to: '/examples', title: 'Dashboard', exact: true },
  { to: '/examples/users', title: 'Users', exact: false },
  { to: '/examples/settings', title: 'Settings', exact: false },
] as const

export function ExamplesLayout() {
  return (
    <div className="min-h-svh bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-8 gap-y-2 px-5 py-4 sm:px-8">
          <Link to="/" className="inline-flex min-h-10 items-center gap-2 text-sm font-medium">
            <ArrowLeft className="size-4" aria-hidden="true" />
            React Starter
          </Link>
          <nav aria-label="Examples" className="flex gap-1">
            {examples.map(({ to, title, exact }) => (
              <Link
                key={to}
                to={to}
                activeOptions={{ exact }}
                className="rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted"
                activeProps={{ className: 'bg-muted text-foreground' }}
              >
                {title}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-7 sm:px-8">
        <p className="mb-6 text-xs text-muted-foreground">Examples / Local sample data</p>
        <Outlet />
      </main>
    </div>
  )
}
