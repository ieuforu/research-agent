import { createFileRoute } from '@tanstack/react-router'
import { MarketingLayout } from '#/features/marketing/components/MarketingLayout'

export const Route = createFileRoute('/_marketing')({
  component: MarketingLayout,
})
