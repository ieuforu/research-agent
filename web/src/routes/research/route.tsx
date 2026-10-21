import { useState } from 'react'
import { Link, Outlet, createFileRoute, useMatchRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { LogOut } from 'lucide-react'
import { sessionQueries } from '#/features/auth/queries'
import { ResearchSidebar } from '#/features/research/components/ResearchSidebar'
import type { ResearchStatus } from '#/features/research/types'
import { clearAuthToken, requireAuth } from '#/lib/auth'
import { cn } from '#/lib/utils.ts'

export const Route = createFileRoute('/research')({
  beforeLoad: () => requireAuth(),
  component: ResearchLayout,
})

function ResearchLayout() {
  const navigate = useNavigate()
  const matchRoute = useMatchRoute()
  const [status, setStatus] = useState<ResearchStatus | undefined>(undefined)

  // Components stay router-agnostic; the layout resolves the active task.
  const match = matchRoute({ to: '/research/$taskId' })
  const activeTaskId = match ? (match as { taskId: string }).taskId : undefined
  const { data: me } = useQuery(sessionQueries.me())

  const openTask = (taskId: string) =>
    void navigate({ to: '/research/$taskId', params: { taskId } })

  return (
    <div className="flex h-dvh flex-col bg-background">
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-border/50 px-4">
        <Link to="/research" className="flex items-center gap-2 text-[13px] font-semibold">
          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-foreground text-[10px] font-bold text-background">
            R
          </span>
          Research Agent
        </Link>

        <div className="flex items-center gap-3">
          {me && <span className="text-[11px] text-muted-foreground/60">{me.email}</span>}
          <button
            type="button"
            onClick={() => {
              clearAuthToken()
              void navigate({ to: '/login' })
            }}
            className="flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-muted/60"
          >
            <LogOut className="h-3 w-3" />
            退出
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside
          className={cn(
            'w-full shrink-0 border-r border-border/50 md:w-[320px]',
            activeTaskId ? 'hidden md:block' : 'block',
          )}
        >
          <ResearchSidebar
            activeTaskId={activeTaskId}
            onSelect={openTask}
            onCreated={openTask}
            status={status}
            onStatusChange={setStatus}
          />
        </aside>

        <main
          className={cn(
            'min-w-0 flex-1 overflow-y-auto',
            activeTaskId ? 'block' : 'hidden md:block',
          )}
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}
