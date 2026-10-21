import { act, cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Provider } from 'jotai'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { routeTree } from '#/routeTree.gen'

const clients: QueryClient[] = []
beforeEach(() => {
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  clients.splice(0).forEach((client) => client.clear())
  window.localStorage.clear()
})

async function openPage(path = '/') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  clients.push(queryClient)
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [path] }),
    context: { queryClient },
    defaultPendingMinMs: 0,
  })
  await router.load()
  render(
    <Provider>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </Provider>,
  )
  return router
}

it('connects the homepage form, card and global confirmation dialog', async () => {
  const user = userEvent.setup()
  await openPage()
  expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('A fresh start.')
  const name = screen.getByRole('textbox', { name: 'Project name' })
  expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
  await user.type(name, 'A little idea')
  await user.click(screen.getByRole('button', { name: 'Save' }))
  expect(screen.getByText('A little idea')).toBeVisible()
  await user.click(screen.getByRole('button', { name: 'Favorite example' }))
  expect(screen.getByRole('button', { name: 'Favorite example' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await user.click(screen.getByRole('button', { name: 'Open dialog' }))
  const dialog = await screen.findByRole('dialog', { name: 'Ready to continue?' })
  await user.click(within(dialog).getByRole('button', { name: 'Confirm' }))
  expect(await screen.findByText('Example confirmed.')).toBeVisible()
})

it('opens existing Users, detail, Dashboard and Settings examples without logging in', async () => {
  const user = userEvent.setup()
  window.localStorage.clear()
  const router = await openPage()
  await user.click(await screen.findByRole('link', { name: 'Explore Users virtual list' }))
  expect(await screen.findByRole('heading', { name: 'Users' })).toBeVisible()
  expect(await screen.findByText('100,000 people')).toBeVisible()
  expect(router.state.location.pathname).toBe('/examples/users')
  await act(async () => {
    await router.navigate({ to: '/examples/users/$userId', params: { userId: '1' } })
  })
  expect(await screen.findByText('ID: 1')).toBeVisible()
  await user.click(
    within(screen.getByRole('navigation', { name: 'Examples' })).getByRole('link', {
      name: 'Users',
    }),
  )
  expect(await screen.findByRole('heading', { name: 'Users' })).toBeVisible()
  await user.click(
    within(screen.getByRole('navigation', { name: 'Examples' })).getByRole('link', {
      name: 'Dashboard',
    }),
  )
  expect(await screen.findByRole('heading', { name: 'Overview' })).toBeVisible()
  expect(screen.getByText('$48,200')).toBeVisible()
  await user.click(screen.getByRole('link', { name: 'Settings' }))
  expect(await screen.findByRole('heading', { name: 'Settings' })).toBeVisible()
  expect(window.localStorage.getItem('auth_token')).toBeNull()
})
