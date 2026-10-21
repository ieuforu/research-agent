import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

const scrypt = promisify(scryptCallback) as (
  password: string,
  salt: Buffer,
  keyLength: number,
) => Promise<Buffer>

const KEY_LENGTH = 64
const SALT_LENGTH = 16
const SCHEME = 'scrypt'

/**
 * scrypt ships with Node, so there is no native build step or extra dependency.
 * The salt is stored next to the derived key; the scheme prefix leaves room to
 * migrate to argon2 later without invalidating existing hashes.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH)
  const derived = await scrypt(password, salt, KEY_LENGTH)

  return `${SCHEME}$${salt.toString('base64url')}$${derived.toString('base64url')}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, saltPart, keyPart] = stored.split('$')

  if (scheme !== SCHEME || !saltPart || !keyPart) return false

  const salt = Buffer.from(saltPart, 'base64url')
  const expected = Buffer.from(keyPart, 'base64url')

  // Base64 decoding never throws, it silently truncates. Without this check a
  // corrupted hash decodes to zero bytes and `timingSafeEqual` compares two
  // empty buffers — which reports every password as correct.
  if (salt.length !== SALT_LENGTH || expected.length !== KEY_LENGTH) return false

  const derived = await scrypt(password, salt, expected.length)

  return timingSafeEqual(derived, expected)
}
