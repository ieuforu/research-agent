import { createFileRoute, redirect } from '@tanstack/react-router'
import { isAuthenticated } from '#/lib/auth'

/** The app has one real destination, so `/` only decides where to send you. */
export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({ to: isAuthenticated() ? '/research' : '/login' })
  },
})
