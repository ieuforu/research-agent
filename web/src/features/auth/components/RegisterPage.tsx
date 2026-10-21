import { Link, useNavigate } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { register } from '#/features/auth/api'
import { setAuthToken } from '#/lib/auth'

const MIN_PASSWORD_LENGTH = 8

export function RegisterPage() {
  const navigate = useNavigate()

  const mutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      register(email, password),
    onSuccess: (session) => {
      setAuthToken(session.token)
      navigate({ to: '/research' })
    },
  })

  return (
    <>
      <h1 className="text-[22px] font-semibold tracking-tight">Create your account</h1>
      <p className="mt-1 text-[14px] text-muted-foreground">
        Get started for free — no credit card needed
      </p>

      <form
        className="mt-7 space-y-4"
        onSubmit={(event) => {
          event.preventDefault()
          const data = new FormData(event.currentTarget)
          const email = String(data.get('email') ?? '').trim()
          const password = String(data.get('password') ?? '')

          if (email && password) mutation.mutate({ email, password })
        }}
      >
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-[13px] font-medium">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
            className="flex h-11 w-full rounded-xl border border-border/60 bg-background px-4 text-[14px] outline-none transition-all placeholder:text-muted-foreground/40 focus:border-foreground/30 focus:ring-2 focus:ring-foreground/[0.06]"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="password" className="text-[13px] font-medium">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={MIN_PASSWORD_LENGTH}
            placeholder={`至少 ${MIN_PASSWORD_LENGTH} 位`}
            required
            className="flex h-11 w-full rounded-xl border border-border/60 bg-background px-4 text-[14px] outline-none transition-all placeholder:text-muted-foreground/40 focus:border-foreground/30 focus:ring-2 focus:ring-foreground/[0.06]"
          />
          <p className="text-[11px] text-muted-foreground/60">
            密码至少 {MIN_PASSWORD_LENGTH} 位，仅保存 scrypt 加盐哈希。
          </p>
        </div>

        {mutation.isError && (
          <p className="rounded-lg bg-red-500/10 px-3 py-2 text-[12px] text-red-600">
            {mutation.error instanceof Error ? mutation.error.message : '注册失败'}
          </p>
        )}

        <button
          type="submit"
          disabled={mutation.isPending}
          className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-foreground py-2.5 text-[14px] font-medium text-background shadow-sm transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-60"
        >
          {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {mutation.isPending ? 'Creating…' : 'Create account'}
        </button>
      </form>

      <p className="mt-7 text-center text-[13px] text-muted-foreground">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-foreground transition-colors hover:underline">
          Sign in
        </Link>
      </p>
    </>
  )
}
