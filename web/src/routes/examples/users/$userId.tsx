import { createFileRoute } from '@tanstack/react-router'
import { UserDetailPage } from '#/features/users/components/UserDetailPage'

export const Route = createFileRoute('/examples/users/$userId')({
  component: UserDetailRoute,
})

function UserDetailRoute() {
  const { userId } = Route.useParams()
  return <UserDetailPage userId={userId} />
}
