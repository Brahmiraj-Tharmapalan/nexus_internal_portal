import { SignJWT, decodeJwt } from 'jose'
import { describe, expect, it } from 'vitest'
import { SESSION_TTL_SECONDS, decrypt, encrypt } from './session'

const key = new TextEncoder().encode(process.env.SESSION_SECRET)

describe('session tokens', () => {
  it('round-trips userId and role', async () => {
    const token = await encrypt({ userId: 'user_1', role: 'ADMIN' })
    await expect(decrypt(token)).resolves.toEqual({ userId: 'user_1', role: 'ADMIN' })
  })

  it('stores only userId and role (plus iat/exp), expiring in 7 days', async () => {
    const extra = { userId: 'user_1', role: 'USER', email: 'leak@example.com' } as const
    const claims = decodeJwt(await encrypt(extra))
    expect(Object.keys(claims).sort()).toEqual(['exp', 'iat', 'role', 'userId'])
    expect(claims.exp! - claims.iat!).toBe(SESSION_TTL_SECONDS)
  })

  it('returns null for a missing or malformed token', async () => {
    await expect(decrypt(undefined)).resolves.toBeNull()
    await expect(decrypt('')).resolves.toBeNull()
    await expect(decrypt('not.a.jwt')).resolves.toBeNull()
  })

  it('returns null for a tampered token', async () => {
    const token = await encrypt({ userId: 'user_1', role: 'USER' })
    const [header, , signature] = token.split('.')
    const forged = Buffer.from(JSON.stringify({ userId: 'user_1', role: 'ADMIN' })).toString(
      'base64url',
    )
    await expect(decrypt(`${header}.${forged}.${signature}`)).resolves.toBeNull()
  })

  it('returns null for a token signed with another secret', async () => {
    const token = await new SignJWT({ userId: 'user_1', role: 'USER' })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('1h')
      .sign(new TextEncoder().encode('a-different-secret-that-is-long-enough'))
    await expect(decrypt(token)).resolves.toBeNull()
  })

  it('returns null for an expired token', async () => {
    const past = Math.floor(Date.now() / 1000) - 60
    const token = await new SignJWT({ userId: 'user_1', role: 'USER' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt(past - 60)
      .setExpirationTime(past)
      .sign(key)
    await expect(decrypt(token)).resolves.toBeNull()
  })

  it('returns null for a validly signed token with a bad payload', async () => {
    const token = await new SignJWT({ userId: 'user_1', role: 'SUPERUSER' })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('1h')
      .sign(key)
    await expect(decrypt(token)).resolves.toBeNull()
  })
})
