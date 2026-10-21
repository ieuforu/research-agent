import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Ban, Loader2 } from 'lucide-react'
import { Button } from '#/components/ui/button.tsx'
import { cancelResearch } from '../api'
import { researchQueries } from '../queries'
import { isActiveStatus } from '../types'
import { useResearchStream } from '../useResearchStream'
import { formatTimestamp, StatusBadge } from './StatusBadge'

interface ResearchDetailPageProps {
  taskId: string
  onBack: () => void
}

export function ResearchDetailPage({ taskId, onBack }: ResearchDetailPageProps) {
  const queryClient = useQueryClient()
  const { data: task, isPending, isError, error } = useQuery(researchQueries.detail(taskId))

  const taskIsActive = task ? isActiveStatus(task.status) : false
  const stream = useResearchStream(taskId, taskIsActive)

  const cancelMutation = useMutation({
    mutationFn: () => cancelResearch(taskId),
    onSettled: () => queryClient.invalidateQueries({ queryKey: researchQueries.all() }),
  })

  if (isPending) {
    return <p className="text-[13px] text-muted-foreground/60">加载中…</p>
  }

  if (isError || !task) {
    return (
      <div>
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft />
          返回
        </Button>
        <p className="mt-4 rounded-xl bg-red-500/10 px-4 py-3 text-[13px] text-red-600">
          任务加载失败：{error instanceof Error ? error.message : '未知错误'}
        </p>
      </div>
    )
  }

  // The stream is authoritative while it is live; the query wins once it settles.
  const status = stream.streaming && stream.status ? stream.status : task.status
  const isActive = isActiveStatus(status)
  const report = task.report ?? (stream.text.length > 0 ? stream.text : null)
  const sources = task.sources ?? (stream.sources.length > 0 ? stream.sources : null)

  return (
    <div>
      <Button variant="ghost" size="sm" onClick={onBack}>
        <ArrowLeft />
        返回工作台
      </Button>

      <div className="mt-4 rounded-2xl border border-border/40 bg-card/50 p-5">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-[18px] leading-snug font-semibold">{task.question}</h1>
          <StatusBadge status={status} />
        </div>

        <p className="mt-2 text-[11px] text-muted-foreground/50">
          创建 {formatTimestamp(task.createdAt)} · 更新 {formatTimestamp(task.updatedAt)} ·
          <span className="ml-1 font-mono">{task.id}</span>
        </p>

        {isActive && (
          <div className="mt-4 flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {stream.streaming ? '实时生成中…' : '正在生成报告，页面会自动刷新…'}
            </span>
            <Button
              variant="destructive"
              size="sm"
              disabled={cancelMutation.isPending}
              onClick={() => cancelMutation.mutate()}
            >
              <Ban />
              {cancelMutation.isPending ? '取消中…' : '取消任务'}
            </Button>
          </div>
        )}

        {stream.error && (
          <p className="mt-3 text-[12px] text-muted-foreground/60">
            实时流已断开（{stream.error}），已自动切换为轮询刷新。
          </p>
        )}

        {cancelMutation.isError && (
          <p className="mt-3 text-[12px] text-red-600">
            取消失败：
            {cancelMutation.error instanceof Error ? cancelMutation.error.message : '未知错误'}
          </p>
        )}
      </div>

      {task.error && (
        <div className="mt-4 rounded-2xl bg-red-500/10 p-5">
          <h2 className="text-[13px] font-medium text-red-600">执行失败</h2>
          <p className="mt-1 text-[13px] leading-relaxed text-red-600/90">{task.error}</p>
        </div>
      )}

      {sources && sources.length > 0 && (
        <section className="mt-4 rounded-2xl border border-border/40 bg-card/50 p-5">
          <h2 className="text-[13px] font-medium text-muted-foreground">
            来源（{sources.length}）
          </h2>
          <ol className="mt-3 flex flex-col gap-2">
            {sources.map((source, index) => (
              <li key={source.url} className="text-[13px]">
                <a
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-4 hover:text-foreground/70"
                >
                  [{index + 1}] {source.title || source.url}
                </a>
                {source.snippet && (
                  <p className="mt-0.5 text-[12px] text-muted-foreground/60">{source.snippet}</p>
                )}
              </li>
            ))}
          </ol>
        </section>
      )}

      {report && (
        <article className="mt-4 rounded-2xl border border-border/40 bg-card/50 p-5">
          <h2 className="text-[13px] font-medium text-muted-foreground">
            {isActive ? '研究报告（生成中）' : '研究报告'}
          </h2>
          <div className="mt-3 text-[14px] leading-relaxed whitespace-pre-wrap">{report}</div>
        </article>
      )}

      {!report && isActive && (
        <div className="mt-4 flex items-center justify-center rounded-2xl border border-dashed border-border/50 py-14">
          <span className="text-[13px] text-muted-foreground/60">正在检索与撰写…</span>
        </div>
      )}
    </div>
  )
}
