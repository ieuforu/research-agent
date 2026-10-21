import { useState } from 'react'
import { Loader2, Sparkles } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '#/components/ui/button.tsx'
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

  const submit = () => {
    if (canSubmit) mutation.mutate(trimmed)
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        submit()
      }}
      className="rounded-xl border border-border/50 bg-card/40 p-2.5"
    >
      <label htmlFor="research-question" className="sr-only">
        研究问题
      </label>
      <textarea
        id="research-question"
        value={question}
        onChange={(event) => setQuestion(event.target.value)}
        onKeyDown={(event) => {
          if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
            event.preventDefault()
            submit()
          }
        }}
        rows={2}
        maxLength={MAX_LENGTH}
        placeholder="问一个值得查证的问题…"
        className="w-full resize-none bg-transparent px-1 py-1 text-[13px] leading-relaxed outline-none placeholder:text-muted-foreground/50"
      />

      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="truncate text-[11px] text-muted-foreground/60">
          {mutation.isError
            ? `提交失败：${mutation.error instanceof Error ? mutation.error.message : '未知错误'}`
            : '⌘/Ctrl + Enter 提交'}
        </p>
        <Button type="submit" size="sm" disabled={!canSubmit}>
          {mutation.isPending ? (
            <>
              <Loader2 className="animate-spin" />
              提交中
            </>
          ) : (
            <>
              <Sparkles />
              开始
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
