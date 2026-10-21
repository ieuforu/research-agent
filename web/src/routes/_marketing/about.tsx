import { createFileRoute } from '@tanstack/react-router'
import { AboutPage } from '#/features/marketing/components/AboutPage'

export const Route = createFileRoute('/_marketing/about')({
  component: AboutPage,
})
