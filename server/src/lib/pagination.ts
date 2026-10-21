import { z } from 'zod'

const cursorPayloadSchema = z.object({
  createdAt: z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
    message: 'Invalid timestamp',
  }),
  id: z.string().uuid(),
})

/**
 * Keyset pagination cursor. Encodes the last row of the previous page so the
 * next page can resume with `(created_at, id) < (cursor.createdAt, cursor.id)`
 * instead of an OFFSET, which would skip or duplicate rows while new tasks are
 * being inserted at the top of the list.
 */
export function encodeCursor(createdAt: Date, id: string): string {
  return Buffer.from(JSON.stringify({ createdAt: createdAt.toISOString(), id })).toString(
    'base64url',
  )
}

export function decodeCursor(value: string): { createdAt: Date; id: string } | null {
  try {
    const raw: unknown = JSON.parse(Buffer.from(value, 'base64url').toString('utf8'))
    const parsed = cursorPayloadSchema.safeParse(raw)

    if (!parsed.success) return null

    return { createdAt: new Date(parsed.data.createdAt), id: parsed.data.id }
  } catch {
    return null
  }
}
