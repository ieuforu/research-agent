import { useInfiniteQuery } from '@tanstack/react-query'
import { FolderOpen } from 'lucide-react'
import { cn } from '#/lib/utils.ts'
import { researchQueries } from '../queries'
import type { ResearchStatus } from '../types'
import { NewResearchForm } from './NewResearchForm'
import { formatRelativeTime, StatusBadge } from './StatusBadge'

const FILTERS: { value: ResearchStatus | undefined; label: string }[] = [
  { value: undefined, label: '全部' },
  { value: 'running', label: '进行中' },
  { value: 'completed', label: '已完成' },
  { value: 'failed', label: '失败' },
]

interface ResearchSidebarProps {
  activeTaskId?: string
  onSelect: (taskId: string) => void
  onCreated: (taskId: string) => void
  status?: ResearchStatus
  onStatusChange: (status: ResearchStatus | undefined) => void
}

export function ResearchSidebar({
  activeTaskId,
  onSelect,
  onCreated,
  status,
  onStatusChange,
}: ResearchSidebarProps) {
  const { data, isPending, isError, error, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery(researchQueries.list(status))

  const tasks = data?.pages.flatMap((page) => page.tasks) ?? []

  return (
    <div className="flex h-full flex-col gap-3 p-3">
      <NewResearchForm onCreated={onCreated} />

      <div className="flex items-center gap-1">
        {FILTERS.map((filter) => {
          const active = filter.value === status

          return (
            <button
              key={filter.label}
              type="button"
              onClick={() => onStatusChange(filter.value)}
              className={cn(
                'rounded-md px-2 py-1 text-[11px] font-medium transition-colors',
                active
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:bg-muted/60',
              )}
            >
              {filter.label}
            </button>
          )
        })}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {isPending && <p className="px-1 py-2 text-[12px] text-muted-foreground/60">加载中…</p>}

        {isError && (
          <p className="rounded-lg bg-red-500/10 px-2.5 py-2 text-[12px] text-red-600">
            {error instanceof Error ? error.message : '加载失败'}
          </p>
        )}

        {!isPending && !isError && tasks.length === 0 && (
          <div className="flex flex-col items-center py-10 text-center">
            <FolderOpen className="h-5 w-5 text-muted-foreground/25" />
            <p className="mt-2 text-[12px] text-muted-foreground/60">还没有研究任务</p>
          </div>
        )}

        <ul className="flex flex-col gap-0.5">
          {tasks.map((task) => (
            <li key={task.id}>
              <button
                type="button"
                onClick={() => onSelect(task.id)}
                aria-current={task.id === activeTaskId ? 'true' : undefined}
                className={cn(
                  'flex w-full flex-col gap-1 rounded-lg px-2.5 py-2 text-left transition-colors',
                  task.id === activeTaskId ? 'bg-muted/70' : 'hover:bg-muted/40',
                )}
              >
                <span className="line-clamp-2 text-[13px] leading-snug font-medium">
                  {task.question}
                </span>
                <span className="flex items-center gap-2">
                  <StatusBadge status={task.status} />
                  <span className="text-[10px] text-muted-foreground/50">
                    {formatRelativeTime(task.createdAt)}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>

        {hasNextPage && (
          <button
            type="button"
            onClick={() => void fetchNextPage()}
            disabled={isFetchingNextPage}
            className="mt-2 w-full rounded-lg border border-border/50 py-1.5 text-[11px] text-muted-foreground transition-colors hover:bg-muted/40"
          >
            {isFetchingNextPage ? '加载中…' : '加载更多'}
          </button>
        )}
      </div>
    </div>
  )
}
