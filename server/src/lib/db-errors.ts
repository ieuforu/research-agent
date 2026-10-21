/**
 * Postgres error codes, unwrapped from whatever the query layer wrapped them in.
 *
 * Drizzle throws `DrizzleQueryError` and keeps the driver error in `cause`, so
 * checking `error.code` alone silently misses constraint violations. Walk the
 * chain instead of guessing the wrapper.
 */
const UNIQUE_VIOLATION = '23505'

export function isUniqueViolation(error: unknown): boolean {
  let current: unknown = error

  for (let depth = 0; depth < 5 && current !== null && current !== undefined; depth += 1) {
    if (typeof current === 'object' && 'code' in current) {
      if ((current as { code: unknown }).code === UNIQUE_VIOLATION) return true
    }

    current = 'cause' in (current as object) ? (current as { cause?: unknown }).cause : undefined
  }

  return false
}
