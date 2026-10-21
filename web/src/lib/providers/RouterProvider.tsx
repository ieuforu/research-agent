import { RouterProvider as TanStackRouterProvider, createRouter } from '@tanstack/react-router'

import { routeTree } from '#/routeTree.gen.ts'
import { queryClient } from '#/lib/queryClient'

const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  scrollRestoration: true,
  defaultPreloadStaleTime: 0,
  context: {
    queryClient,
  },
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

export function RouterProvider() {
  return <TanStackRouterProvider router={router} />
}
