import 'dotenv/config'
import { z } from 'zod'

const baseUrl = process.env.TAVILY_BASE_URL ?? 'https://api.tavily.com'
const apiKey = process.env.TAVILY_API_KEY

const searchResponseSchema = z.object({
  results: z
    .array(
      z.object({
        title: z.string().optional(),
        url: z.string(),
        content: z.string().optional(),
      }),
    )
    .default([]),
})

export interface SearchResult {
  title: string
  url: string
  snippet: string
}

/**
 * Search is optional: without a key the research pipeline still produces a
 * report, it just cannot cite sources. Callers must check this before searching.
 */
export function isSearchConfigured(): boolean {
  return Boolean(apiKey)
}

export async function searchWeb(
  query: string,
  options: { maxResults?: number; signal?: AbortSignal } = {},
): Promise<SearchResult[]> {
  if (!apiKey) {
    throw new Error('TAVILY_API_KEY is not configured')
  }

  const response = await fetch(`${baseUrl}/search`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      search_depth: 'basic',
      include_answer: false,
      max_results: options.maxResults ?? 5,
    }),
    signal: options.signal,
  })

  if (!response.ok) {
    throw new Error(`Tavily search failed with HTTP ${response.status}`)
  }

  const parsed = searchResponseSchema.safeParse(await response.json())

  if (!parsed.success) {
    throw new Error('Tavily returned an unexpected payload')
  }

  return parsed.data.results.map((result) => ({
    title: result.title?.trim() || result.url,
    url: result.url,
    snippet: (result.content ?? '').trim().slice(0, 500),
  }))
}
