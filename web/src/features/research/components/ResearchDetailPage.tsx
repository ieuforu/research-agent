import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Ban, Compass, FileText, Loader2 } from 'lucide-react'
import { Button } from '#/components/ui/button.tsx'
import { cn } from '#/lib/utils.ts'
import { cancelResearch } from '../api'
import { researchQueries } from '../queries'
import { isActiveStatus } from '../types'
import { useResearchStream } from '../useResearchStream'
import { ReportBody } from './ReportBody'
import { formatRelativeTime, StatusBadge } from './StatusBadge'

interface ResearchDetailPageProps {
  taskId: string
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

/** Which phase the pipeline is in, derived from what the stream has delivered. */
function stageLabel(sources: number, characters: number): string {
  if (characters > 0) return '撰写中'
  if (sources > 0) return '阅读资料'

  return '规划检索'
}

export function ResearchDetailPage({ taskId }: ResearchDetailPageProps) {
  const queryClient = useQueryClient()
  const { data: task, isPending, isError, error } = useQuery(researchQueries.detail(taskId))

  const taskIsActive = task ? isActiveStatus(task.status) : false
  const stream = useResearchStream(taskId, taskIsActive)

  const cancelMutation = useMutation({
    mutationFn: () => cancelResearch(taskId),
    onSettled: () => queryClient.invalidateQueries({ queryKey: researchQueries.all() }),
  })

  if (isPending) {
    return (
      <div className="flex flex-col gap-3 p-6">
        <div className="h-5 w-2/3 animate-pulse rounded bg-muted" />
        <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
        <div className="mt-4 h-40 animate-pulse rounded-xl bg-muted/60" />
      </div>
    )
  }

  if (isError || !task) {
    return (
      <div className="p-6">
        <p className="rounded-xl bg-red-500/10 px-4 py-3 text-[13px] text-red-600">
          {error instanceof Error ? error.message : '任务加载失败'}
        </p>
      </div>
    )
  }

  const status = stream.streaming && stream.status ? stream.status : task.status
  const isActive = isActiveStatus(status)
  const sources = task.sources ?? (stream.sources.length > 0 ? stream.sources : [])
  const report = task.report ?? (stream.text.length > 0 ? stream.text : null)
  const isStreaming = isActive && Boolean(stream.text) && !task.report

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5 p-6">
      <header>
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-[19px] leading-snug font-semibold tracking-tight">{task.question}</h1>
          <StatusBadge status={status} />
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground/60">
          <span>{formatRelativeTime(task.createdAt)}</span>
          {sources.length > 0 && <span>{sources.length} 条来源</span>}
          {report && <span>{report.length} 字</span>}
          <span className="font-mono text-[10px] opacity-60">{task.id.slice(0, 8)}</span>
        </div>

        {isActive && (
          <div className="mt-3 flex items-center gap-3 rounded-xl bg-muted/40 px-3 py-2">
            <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground" />
            <span className="flex-1 text-[12px] text-muted-foreground">
              {stageLabel(sources.length, stream.text.length)}
              {stream.text.length > 0 && ` · ${stream.text.length} 字`}
            </span>
            <Button
              variant="ghost"
              size="xs"
              disabled={cancelMutation.isPending}
              onClick={() => cancelMutation.mutate()}
            >
              <Ban />
              取消
            </Button>
          </div>
        )}

        {stream.error && (
          <p className="mt-2 text-[11px] text-muted-foreground/60">
            实时流已断开（{stream.error}），已切换为轮询刷新。
          </p>
        )}

        {cancelMutation.isError && (
          <p className="mt-2 text-[11px] text-red-600">
            取消失败：
            {cancelMutation.error instanceof Error ? cancelMutation.error.message : '未知错误'}
          </p>
        )}
      </header>

      {task.error && (
        <div className="rounded-xl bg-red-500/10 p-4">
          <h2 className="text-[12px] font-medium text-red-600">执行失败</h2>
          <p className="mt-1 text-[13px] leading-relaxed text-red-600/90">{task.error}</p>
        </div>
      )}

      {sources.length > 0 && (
        <section>
          <h2 className="flex items-center gap-1.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            <Compass className="h-3 w-3" />
            来源
          </h2>
          <ol className="mt-2 flex flex-col gap-1.5">
            {sources.map((source, index) => (
              <li
                key={source.url}
                id={`source-${index + 1}`}
                className="scroll-mt-6 rounded-lg border border-border/40 bg-card/40 px-3 py-2"
              >
                <a
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-baseline gap-2 text-[13px] hover:underline"
                >
                  <span className="text-[10px] font-mono text-muted-foreground/50">
                    {index + 1}
                  </span>
                  <span className="flex-1 font-medium">{source.title || source.url}</span>
                  <span className="shrink-0 text-[10px] text-muted-foreground/50">
                    {hostOf(source.url)}
                  </span>
                </a>
                {source.snippet && (
                  <p className="mt-1 line-clamp-2 pl-5 text-[11px] leading-relaxed text-muted-foreground/60">
                    {source.snippet}
                  </p>
                )}
              </li>
            ))}
          </ol>
        </section>
      )}

      {report ? (
        <section>
          <h2 className="flex items-center gap-1.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            <FileText className="h-3 w-3" />
            研究报告
          </h2>
          <div className="mt-2 rounded-xl border border-border/40 bg-card/40 p-4">
            <ReportBody text={report} sources={sources} streaming={isStreaming} />
          </div>
        </section>
      ) : (
        isActive && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/50 py-16">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground/40" />
            <p className="mt-3 text-[12px] text-muted-foreground/60">
              {stageLabel(sources.length, 0)}…
            </p>
          </div>
        )
      )}

      {!isActive && !report && !task.error && (
        <p className={cn('text-[12px] text-muted-foreground/60')}>该任务没有产出报告。</p>
      )}
    </div>
  )
}
