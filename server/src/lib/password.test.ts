import { describe, expect, it } from 'vitest'
import { hashPassword, verifyPassword } from './password.js'

const password = 'correct horse battery staple'

describe('password hashing', () => {
  it('verifies the original password', async () => {
    const stored = await hashPassword(password)

    await expect(verifyPassword(password, stored)).resolves.toBe(true)
  })

  it('rejects a wrong password', async () => {
    const stored = await hashPassword(password)

    await expect(verifyPassword('wrong horse battery staple', stored)).resolves.toBe(false)
  })

  it('salts each hash, so equal passwords produce different digests', async () => {
    const first = await hashPassword(password)
    const second = await hashPassword(password)

    expect(first).not.toBe(second)
    await expect(verifyPassword(password, first)).resolves.toBe(true)
    await expect(verifyPassword(password, second)).resolves.toBe(true)
  })

  it.each([
    ['empty string', ''],
    ['missing parts', 'scrypt$onlysalt'],
    ['unknown scheme', 'bcrypt$c2FsdA$a2V5'],
    ['corrupted base64', 'scrypt$!!!$???'],
  ])('returns false for a malformed stored hash (%s)', async (_label, stored) => {
    await expect(verifyPassword(password, stored)).resolves.toBe(false)
  })
})
