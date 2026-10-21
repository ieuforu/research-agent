import { DashboardHomePage } from '#/features/dashboard/DashboardPage.tsx'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/examples/')({
  component: DashboardHomePage,
})
