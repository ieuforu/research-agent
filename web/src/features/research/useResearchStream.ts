import { useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { researchQueries } from './queries'
import { openResearchStream } from './stream'
import type { ResearchSource, ResearchStatus } from './types'

interface ResearchStreamState {
  text: string
  sources: ResearchSource[]
  status: ResearchStatus | null
  streaming: boolean
  error: string | null
}

const EMPTY: ResearchStreamState = {
  text: '',
  sources: [],
  status: null,
  streaming: false,
  error: null,
}

/**
 * Live view of an active task. Falls back to the query's polling when the
 * stream is unavailable, so the page never depends on SSE alone.
 */
export function useResearchStream(taskId: string, enabled: boolean): ResearchStreamState {
  const queryClient = useQueryClient()
  const [state, setState] = useState<ResearchStreamState>(EMPTY)
  const closeRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    if (!enabled) {
      setState(EMPTY)

      return
    }

    setState({ ...EMPTY, streaming: true })

    closeRef.current = openResearchStream(taskId, {
      onStatus: (status) => setState((prev) => ({ ...prev, status })),
      onSources: (sources) => setState((prev) => ({ ...prev, sources })),
      onToken: (delta) => setState((prev) => ({ ...prev, text: prev.text + delta })),
      onDone: (task) => {
        setState((prev) => ({ ...prev, streaming: false }))
        queryClient.setQueryData(researchQueries.detail(task.id).queryKey, task)
        void queryClient.invalidateQueries({ queryKey: researchQueries.all() })
      },
      onError: (message) => {
        setState((prev) => ({ ...prev, streaming: false, error: message }))
        // Polling picks up from here.
        void queryClient.invalidateQueries({ queryKey: researchQueries.detail(taskId).queryKey })
      },
    })

    return () => {
      closeRef.current?.()
      closeRef.current = null
    }
  }, [enabled, queryClient, taskId])

  return state
}
