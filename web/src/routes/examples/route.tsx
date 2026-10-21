import { createFileRoute } from '@tanstack/react-router'
import { ExamplesLayout } from '#/features/examples/components/ExamplesLayout'

// Public demos backed only by local mock data.
export const Route = createFileRoute('/examples')({
  component: ExamplesLayout,
})
