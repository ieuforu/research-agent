import { Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/examples/users')({
  component: () => <Outlet />,
})
