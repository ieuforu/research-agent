import { describe, expect, it } from 'vitest'
import { decodeCursor, encodeCursor } from './pagination.js'

const id = '11111111-1111-4111-8111-111111111111'
const createdAt = new Date('2026-10-21T02:00:00.000Z')

describe('cursor encoding', () => {
  it('round-trips a timestamp and id', () => {
    const decoded = decodeCursor(encodeCursor(createdAt, id))

    expect(decoded).not.toBeNull()
    expect(decoded?.id).toBe(id)
    expect(decoded?.createdAt.toISOString()).toBe(createdAt.toISOString())
  })

  it('produces an url-safe string', () => {
    const cursor = encodeCursor(createdAt, id)

    expect(cursor).toMatch(/^[A-Za-z0-9_-]+$/)
  })

  it.each([
    ['not base64 at all', 'not-base64!!'],
    ['base64 of non-JSON', Buffer.from('plain text').toString('base64url')],
    ['base64 of JSON without fields', Buffer.from(JSON.stringify({})).toString('base64url')],
    [
      'invalid uuid',
      Buffer.from(JSON.stringify({ createdAt: createdAt.toISOString(), id: 'nope' })).toString(
        'base64url',
      ),
    ],
    [
      'invalid timestamp',
      Buffer.from(JSON.stringify({ createdAt: 'not-a-date', id })).toString('base64url'),
    ],
  ])('rejects %s', (_label, value) => {
    expect(decodeCursor(value)).toBeNull()
  })
})
