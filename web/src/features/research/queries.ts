import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query'
import { fetchResearchList, fetchResearchTask } from './api'
import { isActiveStatus, type ResearchStatus } from './types'

const PAGE_SIZE = 20

export const researchQueries = {
  all: () => ['research'] as const,

  list: (status?: ResearchStatus) =>
    infiniteQueryOptions({
      queryKey: [...researchQueries.all(), 'list', status ?? 'all'],
      queryFn: ({ pageParam }) =>
        fetchResearchList({ limit: PAGE_SIZE, cursor: pageParam, status }),
      initialPageParam: null as string | null,
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      staleTime: 5_000,
      // Poll only while something is in flight; stop as soon as everything settles.
      refetchInterval: (query) => {
        const pages = query.state.data?.pages
        const hasActive = pages?.some((page) =>
          page.tasks.some((task) => isActiveStatus(task.status)),
        )

        return hasActive ? 3_000 : false
      },
    }),

  detail: (id: string) =>
    queryOptions({
      queryKey: [...researchQueries.all(), 'detail', id],
      queryFn: () => fetchResearchTask(id),
      staleTime: 0,
      refetchInterval: (query) => {
        const status = query.state.data?.status

        return status && isActiveStatus(status) ? 1_500 : false
      },
    }),
}
