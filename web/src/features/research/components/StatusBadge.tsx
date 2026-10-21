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
    chip: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  },
  completed: {
    label: '已完成',
    dot: 'bg-emerald-500',
    chip: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },
  failed: {
    label: '失败',
    dot: 'bg-red-500',
    chip: 'bg-red-500/10 text-red-600 dark:text-red-400',
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
        'inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium',
        config.chip,
        className,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', config.dot)} />
      {config.label}
    </span>
  )
}

const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['second', 60],
  ['minute', 60],
  ['hour', 24],
  ['day', 30],
  ['month', 12],
  ['year', Number.POSITIVE_INFINITY],
]

const relativeFormatter = new Intl.RelativeTimeFormat('zh-CN', { numeric: 'auto' })

/** "3 分钟前" style timestamps; the workbench shows many of these per screen. */
export function formatRelativeTime(value: string, now = Date.now()): string {
  const timestamp = new Date(value).getTime()

  if (Number.isNaN(timestamp)) return ''

  let delta = (timestamp - now) / 1000

  for (const [unit, size] of RELATIVE_UNITS) {
    if (Math.abs(delta) < size) return relativeFormatter.format(Math.round(delta), unit)

    delta /= size
  }

  return ''
}

export function formatTimestamp(value: string): string {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return ''

  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}
