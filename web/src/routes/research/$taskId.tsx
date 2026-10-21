import { createFileRoute } from '@tanstack/react-router'
import { ResearchDetailPage } from '#/features/research/components/ResearchDetailPage'

export const Route = createFileRoute('/research/$taskId')({
  component: ResearchDetailRoute,
})

function ResearchDetailRoute() {
  const { taskId } = Route.useParams()

  return <ResearchDetailPage taskId={taskId} />
}
