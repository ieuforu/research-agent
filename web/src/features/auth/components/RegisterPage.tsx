import { Link, useNavigate } from '@tanstack/react-router'
import { setAuthToken } from '#/lib/auth'
import { SocialButton } from './LoginPage'

export function RegisterPage() {
  const navigate = useNavigate()

  return (
    <>
      <h1 className="text-[22px] font-semibold tracking-tight">Create your account</h1>
      <p className="mt-1 text-[14px] text-muted-foreground">
        Get started for free — no credit card needed
      </p>

      <form
        className="mt-7 space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          const data = new FormData(e.currentTarget)
          if (data.get('email') && data.get('password')) {
            setAuthToken('mock_token_' + Date.now())
            navigate({ to: '/examples' })
          }
        }}
      >
        <div className="space-y-1.5">
          <label htmlFor="name" className="text-[13px] font-medium">
            Full name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            placeholder="John Doe"
            required
            className="flex h-11 w-full rounded-xl border border-border/60 bg-background px-4 text-[14px] outline-none transition-all placeholder:text-muted-foreground/40 focus:border-foreground/30 focus:ring-2 focus:ring-foreground/[0.06]"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-[13px] font-medium">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
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
            placeholder="At least 8 characters"
            required
            minLength={8}
            className="flex h-11 w-full rounded-xl border border-border/60 bg-background px-4 text-[14px] outline-none transition-all placeholder:text-muted-foreground/40 focus:border-foreground/30 focus:ring-2 focus:ring-foreground/[0.06]"
          />
        </div>
        <button
          type="submit"
          className="mt-1 w-full rounded-xl bg-foreground py-2.5 text-[14px] font-medium text-background shadow-sm transition-all hover:opacity-90 active:scale-[0.99]"
        >
          Create account
        </button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border/50" />
        </div>
        <div className="relative flex justify-center text-[12px]">
          <span className="bg-background px-3 text-muted-foreground/50">or continue with</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <SocialButton
          provider="google"
          onClick={() => {
            setAuthToken('mock_google_token_' + Date.now())
            navigate({ to: '/examples' })
          }}
        />
        <SocialButton
          provider="github"
          onClick={() => {
            setAuthToken('mock_github_token_' + Date.now())
            navigate({ to: '/examples' })
          }}
        />
      </div>

      <p className="mt-7 text-center text-[13px] text-muted-foreground">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-foreground transition-colors hover:underline">
          Sign in
        </Link>
      </p>
    </>
  )
}
