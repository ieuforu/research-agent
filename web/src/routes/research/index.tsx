import { createFileRoute } from '@tanstack/react-router'
import { Compass } from 'lucide-react'

export const Route = createFileRoute('/research/')({
  component: EmptyPane,
})

function EmptyPane() {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
      <Compass className="h-6 w-6 text-muted-foreground/25" />
      <h2 className="mt-4 text-[15px] font-medium">选一个任务，或提出新问题</h2>
      <p className="mt-1 max-w-sm text-[12px] leading-relaxed text-muted-foreground/60">
        提交后会自动规划检索、抓取来源并逐字生成带角标引用的报告。整个过程可以在左侧列表里实时跟踪。
      </p>
    </div>
  )
}
