import { createFileRoute } from '@tanstack/react-router'
import { Home } from '#/features/marketing/components/HomePage'

export const Route = createFileRoute('/_marketing/')({
  component: Home,
})
