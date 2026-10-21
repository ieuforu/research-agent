import { getAuthToken } from '#/lib/auth.ts'
import ky, { isHTTPError, type KyInstance, type Options } from 'ky'

export { NetworkError, TimeoutError } from 'ky'

// --- Error types ---
export class ApiError extends Error {
  status: number
  body: unknown

  constructor(message: string, status: number, body: unknown, options?: ErrorOptions) {
    super(message, options)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

// --- Config ---
export const API_PREFIX = import.meta.env.VITE_API_URL ?? '/api'

/** Absolute URL for transports that bypass ky, such as EventSource. */
export function apiUrl(path: string): string {
  const base = API_PREFIX.replace(/\/$/, '')
  const suffix = path.startsWith('/') ? path : `/${path}`

  return `${base}${suffix}`
}

// --- Ky instance ---
export const http: KyInstance = ky.create({
  prefix: API_PREFIX,
  timeout: 15_000,
  retry: { limit: 1, methods: ['get'], statusCodes: [408, 502, 503, 504] },
  // An empty successful response is valid; malformed non-empty JSON must still fail.
  parseJson: (text) => (text === '' ? undefined : JSON.parse(text)),
  hooks: {
    beforeRequest: [
      (state) => {
        const token = getAuthToken()
        if (token) state.request.headers.set('Authorization', `Bearer ${token}`)
      },
    ],
    beforeError: [
      ({ error }) => {
        // Convert only the final HTTP failure, after Ky has finished retrying.
        // Preserve cancellation, timeout, network, and application errors as-is.
        if (!isHTTPError(error)) return error

        const body: unknown = error.data ?? null
        const message =
          typeof body === 'object' &&
          body !== null &&
          'message' in body &&
          typeof body.message === 'string' &&
          body.message.trim()
            ? body.message
            : error.response.statusText || `HTTP ${error.response.status}`

        return new ApiError(message, error.response.status, body, { cause: error })
      },
    ],
  },
})

// --- Typed helpers ---
// Callers must handle undefined for endpoints that return no response body.

export function apiGet<T = unknown>(url: string, opts?: Options): Promise<T | undefined> {
  return http.get(url, opts).json<T | undefined>()
}

export function apiPost<T = unknown>(url: string, opts?: Options): Promise<T | undefined> {
  return http.post(url, opts).json<T | undefined>()
}

export function apiPut<T = unknown>(url: string, opts?: Options): Promise<T | undefined> {
  return http.put(url, opts).json<T | undefined>()
}

export function apiDelete<T = unknown>(url: string, opts?: Options): Promise<T | undefined> {
  return http.delete(url, opts).json<T | undefined>()
}
