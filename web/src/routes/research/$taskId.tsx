import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ResearchDetailPage } from '#/features/research/components/ResearchDetailPage'

export const Route = createFileRoute('/research/$taskId')({
  component: ResearchDetailRoute,
})

function ResearchDetailRoute() {
  const { taskId } = Route.useParams()
  const navigate = useNavigate()

  return <ResearchDetailPage taskId={taskId} onBack={() => void navigate({ to: '/research' })} />
}
