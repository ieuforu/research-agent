import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ResearchWorkbenchPage } from '#/features/research/components/ResearchWorkbenchPage'
import type { ResearchStatus } from '#/features/research/types'

export const Route = createFileRoute('/research/')({
  component: ResearchWorkbenchRoute,
})

function ResearchWorkbenchRoute() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<ResearchStatus | undefined>(undefined)

  return (
    <ResearchWorkbenchPage
      status={status}
      onStatusChange={setStatus}
      onSelect={(taskId) => void navigate({ to: '/research/$taskId', params: { taskId } })}
    />
  )
}
