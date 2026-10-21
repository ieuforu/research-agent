import { useInfiniteQuery } from '@tanstack/react-query'
import { ChevronRight, FolderOpen } from 'lucide-react'
import { Button } from '#/components/ui/button.tsx'
import { researchQueries } from '../queries'
import type { ResearchStatus } from '../types'
import { NewResearchForm } from './NewResearchForm'
import { formatTimestamp, StatusBadge } from './StatusBadge'

const FILTERS: { value: ResearchStatus | undefined; label: string }[] = [
  { value: undefined, label: '全部' },
  { value: 'running', label: '进行中' },
  { value: 'completed', label: '已完成' },
  { value: 'failed', label: '失败' },
]

interface ResearchWorkbenchPageProps {
  onSelect: (taskId: string) => void
  status?: ResearchStatus
  onStatusChange?: (status: ResearchStatus | undefined) => void
}

export function ResearchWorkbenchPage({
  onSelect,
  status,
  onStatusChange,
}: ResearchWorkbenchPageProps) {
  const { data, isPending, isError, error, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery(researchQueries.list(status))

  const tasks = data?.pages.flatMap((page) => page.tasks) ?? []

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[22px] font-semibold tracking-tight">研究工作台</h1>
        <p className="mt-0.5 text-[14px] text-muted-foreground">
          提交一个研究问题，任务会在后台执行，页面自动刷新进度。
        </p>
      </div>

      <NewResearchForm onCreated={onSelect} />

      <div className="mt-7 flex items-center gap-2">
        {FILTERS.map((filter) => {
          const active = filter.value === status

          return (
            <button
              key={filter.label}
              type="button"
              onClick={() => onStatusChange?.(filter.value)}
              className={`rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors ${
                active
                  ? 'bg-foreground text-background'
                  : 'border border-border/50 text-muted-foreground hover:bg-muted/40'
              }`}
            >
              {filter.label}
            </button>
          )
        })}
      </div>

      <div className="mt-4">
        {isPending && <p className="text-[13px] text-muted-foreground/60">加载中…</p>}

        {isError && (
          <p className="rounded-xl bg-red-500/10 px-4 py-3 text-[13px] text-red-600">
            任务列表加载失败：{error instanceof Error ? error.message : '未知错误'}
          </p>
        )}

        {!isPending && !isError && tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/50 py-14 text-center">
            <FolderOpen className="h-6 w-6 text-muted-foreground/30" />
            <p className="mt-3 text-[13px] text-muted-foreground/60">还没有研究任务</p>
          </div>
        )}

        <ul className="flex flex-col gap-2">
          {tasks.map((task) => (
            <li key={task.id}>
              <button
                type="button"
                onClick={() => onSelect(task.id)}
                className="group flex w-full items-center gap-4 rounded-2xl border border-border/40 bg-card/50 px-5 py-4 text-left transition-all hover:border-border/70 hover:bg-muted/30"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-medium">{task.question}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground/50">
                    {formatTimestamp(task.createdAt)}
                    {task.error ? ` · ${task.error}` : ''}
                  </p>
                </div>
                <StatusBadge status={task.status} />
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/30 transition-colors group-hover:text-foreground/60" />
              </button>
            </li>
          ))}
        </ul>

        {hasNextPage && (
          <div className="mt-4 flex justify-center">
            <Button
              variant="outline"
              onClick={() => void fetchNextPage()}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? '加载中…' : '加载更多'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
