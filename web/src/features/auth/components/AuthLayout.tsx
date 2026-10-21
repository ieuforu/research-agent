import { Link, Outlet } from '@tanstack/react-router'

export function AuthLayout() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 0%, oklch(0.7 0.1 260 / 0.06) 0%, transparent 60%)',
        }}
      />

      <div className="relative w-full max-w-[380px]">
        <Link
          to="/"
          className="mb-10 inline-flex items-center gap-2 text-[15px] font-semibold tracking-tight"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-foreground text-[13px] font-bold text-background">
            R
          </div>
          Research Agent
        </Link>

        <Outlet />

        <p className="mt-10 text-center text-[12px] text-muted-foreground/50">
          DeepSeek 生成 · 来源可核验
        </p>
      </div>
    </div>
  )
}
