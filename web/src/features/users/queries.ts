import { queryOptions } from '@tanstack/react-query'
import { fetchUsers, fetchUserById } from './mock'

export const userQueries = {
  all: () => ['users'] as const,

  list: (params: { page: number; pageSize: number; search: string }) =>
    queryOptions({
      queryKey: [...userQueries.all(), 'list', params],
      queryFn: () => fetchUsers(params),
      staleTime: 30_000,
      placeholderData: (prev) => prev,
    }),

  detail: (id: number) =>
    queryOptions({
      queryKey: [...userQueries.all(), 'detail', id],
      queryFn: () => fetchUserById(id),
      staleTime: 60_000,
    }),
}
