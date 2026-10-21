import { Link } from '@tanstack/react-router'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useRef, useState, useCallback, useMemo } from 'react'
import { Search, X } from 'lucide-react'
import { fetchUsers } from '#/features/users/mock'
import type { User } from '#/features/users/types'

const PAGE_SIZE = 50
const ROW_HEIGHT = 72

export function UsersPage() {
  const parentRef = useRef<HTMLDivElement>(null)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const onSearchChange = useCallback((val: string) => {
    setSearch(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setDebouncedSearch(val), 250)
  }, [])

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery({
    queryKey: ['users', 'infinite', debouncedSearch],
    queryFn: ({ pageParam }) =>
      fetchUsers({ page: pageParam, pageSize: PAGE_SIZE, search: debouncedSearch }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
    staleTime: 30_000,
  })

  const rows = useMemo(() => {
    if (!data) return []
    return data.pages.flatMap((p) => p.data)
  }, [data])

  const totalFetched = rows.length
  const totalCount = data?.pages[0]?.total ?? 0

  const virtualizer = useVirtualizer({
    count: hasNextPage ? totalFetched + 1 : totalFetched,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 8,
  })

  const virtualItems = virtualizer.getVirtualItems()
  const lastItem = virtualItems[virtualItems.length - 1]
  if (lastItem && lastItem.index >= totalFetched - 10 && hasNextPage && !isFetchingNextPage) {
    fetchNextPage()
  }

  return (
    <div className="flex h-[calc(100vh-120px)] flex-col">
      {/* Top bar */}
      <div className="mb-5 flex items-end justify-between">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight">Users</h1>
          <p className="mt-0.5 text-[14px] text-muted-foreground">
            {isLoading ? 'Loading…' : `${totalCount.toLocaleString()} people`}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/40" />
        <input
          type="text"
          placeholder="Search people…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-10 w-full rounded-xl border border-border/50 bg-muted/30 pl-10 pr-9 text-[14px] outline-none transition-all placeholder:text-muted-foreground/40 focus:bg-background focus:border-foreground/20 focus:ring-2 focus:ring-foreground/[0.05]"
        />
        {search && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* List */}
      <div
        ref={parentRef}
        className="flex-1 overflow-auto rounded-2xl border border-border/40"
        style={{ contain: 'strict' }}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualItems.map((virtualRow) => {
            const isLoaderRow = virtualRow.index >= totalFetched
            const user = rows[virtualRow.index] as User | undefined
            const isLast = virtualRow.index === totalFetched - 1

            return (
              <div
                key={virtualRow.key}
                data-index={virtualRow.index}
                ref={virtualizer.measureElement}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                {isLoaderRow ? (
                  <div className="flex h-[72px] items-center justify-center text-[13px] text-muted-foreground/40">
                    {hasNextPage ? (
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/20 border-t-foreground/40" />
                        Loading…
                      </div>
                    ) : (
                      'No more users'
                    )}
                  </div>
                ) : user ? (
                  <Link
                    to="/examples/users/$userId"
                    params={{ userId: String(user.id) }}
                    className={`flex items-center gap-4 px-5 transition-colors hover:bg-muted/40 ${
                      !isLast ? 'border-b border-border/20' : ''
                    }`}
                    style={{ height: `${ROW_HEIGHT}px` }}
                  >
                    {/* Avatar */}
                    <img
                      src={user.avatar}
                      alt=""
                      className="h-10 w-10 shrink-0 rounded-full bg-muted ring-1 ring-border/30"
                    />

                    {/* Name + email */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-medium leading-tight">{user.name}</p>
                      <p className="mt-0.5 truncate text-[12px] text-muted-foreground/50">
                        {user.email}
                      </p>
                    </div>

                    {/* Department — hidden on small */}
                    <div className="hidden w-32 shrink-0 text-[13px] text-muted-foreground md:block">
                      {user.department}
                    </div>

                    {/* Status pill */}
                    <StatusPill status={user.status} />

                    {/* Role — subtle */}
                    <div className="hidden w-20 text-right text-[12px] text-muted-foreground/40 capitalize sm:block">
                      {user.role}
                    </div>
                  </Link>
                ) : null}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function StatusPill({ status }: { status: string }) {
  const config: Record<string, { dot: string; bg: string; text: string }> = {
    active: {
      dot: 'bg-emerald-500',
      bg: 'bg-emerald-500/8',
      text: 'text-emerald-600',
    },
    inactive: {
      dot: 'bg-muted-foreground/30',
      bg: 'bg-muted',
      text: 'text-muted-foreground/60',
    },
    suspended: {
      dot: 'bg-red-400',
      bg: 'bg-red-500/8',
      text: 'text-red-500',
    },
  }
  const c = config[status] ?? config.inactive

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize ${c.bg} ${c.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
      {status}
    </span>
  )
}
