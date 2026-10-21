import { Link, Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/research')({
  component: ResearchLayout,
})

function ResearchLayout() {
  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-10">
      <header className="mb-8 flex items-center justify-between">
        <Link to="/research" className="text-[13px] font-semibold tracking-tight">
          Research Agent
        </Link>
        <span className="text-[11px] text-muted-foreground/50">DeepSeek · 后台执行</span>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  )
}
