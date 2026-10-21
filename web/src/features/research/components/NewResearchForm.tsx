import { useState } from 'react'
import { Loader2, Sparkles } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '#/components/ui/button.tsx'
import { Label } from '#/components/ui/label.tsx'
import { createResearch } from '../api'
import { researchQueries } from '../queries'

const MAX_LENGTH = 10_000

interface NewResearchFormProps {
  onCreated?: (taskId: string) => void
}

export function NewResearchForm({ onCreated }: NewResearchFormProps) {
  const [question, setQuestion] = useState('')
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: createResearch,
    onSuccess: (task) => {
      setQuestion('')
      void queryClient.invalidateQueries({ queryKey: researchQueries.all() })
      onCreated?.(task.id)
    },
  })

  const trimmed = question.trim()
  const canSubmit = trimmed.length > 0 && trimmed.length <= MAX_LENGTH && !mutation.isPending

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        if (canSubmit) mutation.mutate(trimmed)
      }}
      className="rounded-2xl border border-border/40 bg-card/50 p-5"
    >
      <Label htmlFor="research-question" className="text-[13px]">
        研究问题
      </Label>
      <textarea
        id="research-question"
        value={question}
        onChange={(event) => setQuestion(event.target.value)}
        rows={3}
        maxLength={MAX_LENGTH}
        placeholder="例如：分析 React Server Components 的优势与局限"
        className="mt-2 w-full resize-y rounded-xl border border-input bg-transparent px-3 py-2 text-[14px] leading-relaxed outline-none transition-colors placeholder:text-muted-foreground/50 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      />

      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-[11px] text-muted-foreground/60">
          {mutation.isError
            ? `提交失败：${mutation.error instanceof Error ? mutation.error.message : '未知错误'}`
            : `${trimmed.length} / ${MAX_LENGTH}`}
        </p>
        <Button type="submit" disabled={!canSubmit} size="lg">
          {mutation.isPending ? (
            <>
              <Loader2 className="animate-spin" />
              提交中…
            </>
          ) : (
            <>
              <Sparkles />
              开始研究
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
