import { apiGet, apiPost } from '#/lib/http.ts'
import type { ResearchListPage, ResearchStatus, ResearchTask, ResearchTaskSummary } from './types'

export interface ListResearchParams {
  limit?: number
  cursor?: string | null
  status?: ResearchStatus
}

export async function fetchResearchList(
  params: ListResearchParams = {},
): Promise<ResearchListPage> {
  const search = new URLSearchParams()

  if (params.limit) search.set('limit', String(params.limit))
  if (params.cursor) search.set('cursor', params.cursor)
  if (params.status) search.set('status', params.status)

  const query = search.toString()
  const data = await apiGet<ResearchListPage>(`research${query ? `?${query}` : ''}`)

  return data ?? { tasks: [], nextCursor: null }
}

export async function fetchResearchTask(id: string): Promise<ResearchTask> {
  const data = await apiGet<{ task: ResearchTask }>(`research/${id}`)

  if (!data?.task) throw new Error('Research task not found')

  return data.task
}

export async function createResearch(question: string): Promise<ResearchTaskSummary> {
  const data = await apiPost<{ task: ResearchTaskSummary }>('research', { json: { question } })

  if (!data?.task) throw new Error('Failed to create research task')

  return data.task
}

export async function cancelResearch(id: string): Promise<ResearchTaskSummary> {
  const data = await apiPost<{ task: ResearchTaskSummary }>(`research/${id}/cancel`)

  if (!data?.task) throw new Error('Failed to cancel research task')

  return data.task
}
