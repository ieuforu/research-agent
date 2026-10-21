import { Link, Outlet, createFileRoute, useNavigate } from '@tanstack/react-router'
import { LogOut } from 'lucide-react'
import { clearAuthToken, requireAuth } from '#/lib/auth'

export const Route = createFileRoute('/research')({
  beforeLoad: () => requireAuth(),
  component: ResearchLayout,
})

function ResearchLayout() {
  const navigate = useNavigate()

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-10">
      <header className="mb-8 flex items-center justify-between">
        <Link to="/research" className="text-[13px] font-semibold tracking-tight">
          Research Agent
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-muted-foreground/50">DeepSeek · 后台执行</span>
          <button
            type="button"
            onClick={() => {
              clearAuthToken()
              void navigate({ to: '/login' })
            }}
            className="flex items-center gap-1 rounded-lg border border-border/50 px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-muted/50"
          >
            <LogOut className="h-3 w-3" />
            退出
          </button>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  )
}
