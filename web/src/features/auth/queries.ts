import { queryOptions } from '@tanstack/react-query'
import { fetchMe } from './api'

export const sessionQueries = {
  me: () =>
    queryOptions({
      queryKey: ['auth', 'me'] as const,
      queryFn: fetchMe,
      staleTime: 5 * 60_000,
      retry: false,
    }),
}
