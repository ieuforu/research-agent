import { useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { researchQueries } from './queries'
import { openResearchStream } from './stream'
import type { ResearchSource, ResearchStatus } from './types'

interface ResearchStreamState {
  /** Identity of the stream this state belongs to; a change resets everything. */
  session: string
  text: string
  sources: ResearchSource[]
  status: ResearchStatus | null
  error: string | null
  ended: boolean
}

interface ResearchStreamResult {
  text: string
  sources: ResearchSource[]
  status: ResearchStatus | null
  streaming: boolean
  error: string | null
}

/**
 * Live view of an active task. Falls back to the query's polling when the
 * stream is unavailable, so the page never depends on SSE alone.
 */
export function useResearchStream(taskId: string, enabled: boolean): ResearchStreamResult {
  const queryClient = useQueryClient()
  const session = `${taskId}:${enabled ? 'on' : 'off'}`
  const [state, setState] = useState<ResearchStreamState>({
    session,
    text: '',
    sources: [],
    status: null,
    error: null,
    ended: false,
  })
  const closeRef = useRef<(() => void) | null>(null)

  // Adjusting state during render (React's documented pattern for derived
  // state) instead of resetting it inside an effect, which would render twice.
  if (state.session !== session) {
    setState({ session, text: '', sources: [], status: null, error: null, ended: false })
  }

  useEffect(() => {
    if (!enabled) return

    closeRef.current = openResearchStream(taskId, {
      onStatus: (status) => setState((prev) => ({ ...prev, status })),
      onSources: (sources) => setState((prev) => ({ ...prev, sources })),
      onToken: (delta) => setState((prev) => ({ ...prev, text: prev.text + delta })),
      onDone: (task) => {
        setState((prev) => ({ ...prev, ended: true }))
        queryClient.setQueryData(researchQueries.detail(task.id).queryKey, task)
        void queryClient.invalidateQueries({ queryKey: researchQueries.all() })
      },
      onError: (message) => {
        setState((prev) => ({ ...prev, ended: true, error: message }))
        // Polling picks up from here.
        void queryClient.invalidateQueries({ queryKey: researchQueries.detail(taskId).queryKey })
      },
    })

    return () => {
      closeRef.current?.()
      closeRef.current = null
    }
  }, [enabled, queryClient, taskId])

  return {
    text: state.text,
    sources: state.sources,
    status: state.status,
    error: state.error,
    streaming: enabled && !state.ended,
  }
}
