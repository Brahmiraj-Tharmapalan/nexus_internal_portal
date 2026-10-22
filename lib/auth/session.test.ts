import { SignJWT, decodeJwt } from 'jose'
import { describe, expect, it } from 'vitest'
import { SESSION_TTL_SECONDS, decrypt, encrypt } from './session'

const key = new TextEncoder().encode(process.env.SESSION_SECRET)

describe('session tokens', () => {
  it('round-trips userId, role and sessionVersion', async () => {
    const token = await encrypt({ userId: 'user_1', role: 'ADMIN', sv: 3 })
    await expect(decrypt(token)).resolves.toEqual({ userId: 'user_1', role: 'ADMIN', sv: 3 })
  })

  it('stores only userId, role and sv (plus iat/exp), expiring in 7 days', async () => {
    const extra = { userId: 'user_1', role: 'USER', sv: 0, email: 'leak@example.com' } as const
    const claims = decodeJwt(await encrypt(extra))
    expect(Object.keys(claims).sort()).toEqual(['exp', 'iat', 'role', 'sv', 'userId'])
    expect(claims.exp! - claims.iat!).toBe(SESSION_TTL_SECONDS)
  })

  it('returns null for a missing or malformed token', async () => {
    await expect(decrypt(undefined)).resolves.toBeNull()
    await expect(decrypt('')).resolves.toBeNull()
    await expect(decrypt('not.a.jwt')).resolves.toBeNull()
  })

  it('returns null for a tampered token', async () => {
    const token = await encrypt({ userId: 'user_1', role: 'USER', sv: 0 })
    const [header, , signature] = token.split('.')
    const forged = Buffer.from(JSON.stringify({ userId: 'user_1', role: 'ADMIN', sv: 0 })).toString(
      'base64url',
    )
    await expect(decrypt(`${header}.${forged}.${signature}`)).resolves.toBeNull()
  })

  it('returns null for a token signed with another secret', async () => {
    const token = await new SignJWT({ userId: 'user_1', role: 'USER', sv: 0 })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('1h')
      .sign(new TextEncoder().encode('a-different-secret-that-is-long-enough'))
    await expect(decrypt(token)).resolves.toBeNull()
  })

  it('returns null for an expired token', async () => {
    const past = Math.floor(Date.now() / 1000) - 60
    const token = await new SignJWT({ userId: 'user_1', role: 'USER', sv: 0 })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt(past - 60)
      .setExpirationTime(past)
      .sign(key)
    await expect(decrypt(token)).resolves.toBeNull()
  })

  it('returns null for a validly signed token with a bad payload', async () => {
    const token = await new SignJWT({ userId: 'user_1', role: 'SUPERUSER', sv: 0 })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('1h')
      .sign(key)
    await expect(decrypt(token)).resolves.toBeNull()
  })

  it('returns null for a token without a valid sessionVersion (e.g. issued before sv existed)', async () => {
    for (const sv of [undefined, -1, 1.5, '0']) {
      const token = await new SignJWT({ userId: 'user_1', role: 'USER', sv })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('1h')
        .sign(key)
      await expect(decrypt(token)).resolves.toBeNull()
    }
  })
})
