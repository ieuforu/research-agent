export type ResearchStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'

export interface ResearchSource {
  title: string
  url: string
  snippet?: string
}

/** Shape returned by `GET /api/research` — the list endpoint omits `report`. */
export interface ResearchTaskSummary {
  id: string
  question: string
  status: ResearchStatus
  error: string | null
  createdAt: string
  updatedAt: string
}

/** Full task including the generated report. */
export interface ResearchTask extends ResearchTaskSummary {
  report: string | null
  sources: ResearchSource[] | null
}

export interface ResearchListPage {
  tasks: ResearchTaskSummary[]
  nextCursor: string | null
}

export const ACTIVE_STATUSES: readonly ResearchStatus[] = ['pending', 'running']

export function isActiveStatus(status: ResearchStatus): boolean {
  return ACTIVE_STATUSES.includes(status)
}
