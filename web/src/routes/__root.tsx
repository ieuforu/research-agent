import { Outlet, createRootRoute } from '@tanstack/react-router'
import { ErrorFallback } from '#/components/ErrorBoundary'
import { ModalRenderer } from '#/components/modals/ModalRenderer'
import '../styles.css'

export const Route = createRootRoute({
  component: RootLayout,
  errorComponent: ({ error, reset }) => <ErrorFallback error={error} reset={reset} />,
})

function RootLayout() {
  return (
    <>
      <Outlet />
      <ModalRenderer />
    </>
  )
}
