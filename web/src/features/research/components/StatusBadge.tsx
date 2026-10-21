import { cn } from '#/lib/utils.ts'
import type { ResearchStatus } from '../types'

const CONFIG: Record<ResearchStatus, { label: string; dot: string; chip: string }> = {
  pending: {
    label: '排队中',
    dot: 'bg-muted-foreground/40',
    chip: 'bg-muted text-muted-foreground',
  },
  running: {
    label: '研究中',
    dot: 'bg-blue-500 animate-pulse',
    chip: 'bg-blue-500/10 text-blue-600',
  },
  completed: {
    label: '已完成',
    dot: 'bg-emerald-500',
    chip: 'bg-emerald-500/10 text-emerald-600',
  },
  failed: {
    label: '失败',
    dot: 'bg-red-500',
    chip: 'bg-red-500/10 text-red-600',
  },
  cancelled: {
    label: '已取消',
    dot: 'bg-muted-foreground/30',
    chip: 'bg-muted text-muted-foreground/70',
  },
}

export function StatusBadge({ status, className }: { status: ResearchStatus; className?: string }) {
  const config = CONFIG[status] ?? CONFIG.pending

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium',
        config.chip,
        className,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', config.dot)} />
      {config.label}
    </span>
  )
}

export function formatTimestamp(value: string): string {
  return new Date(value).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}
