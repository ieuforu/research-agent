import { createFileRoute } from '@tanstack/react-router'
import { AuthLayout } from '#/features/auth/components/AuthLayout'
import { redirectIfAuthenticated } from '#/lib/auth'

export const Route = createFileRoute('/_auth')({
  beforeLoad: () => redirectIfAuthenticated(),
  component: AuthLayout,
})
