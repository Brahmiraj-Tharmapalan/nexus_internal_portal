import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/lib/http'

const { findUnique } = vi.hoisted(() => ({ findUnique: vi.fn() }))
vi.mock('@/lib/db', () => ({ prisma: { user: { findUnique } } }))

const { getSession } = vi.hoisted(() => ({ getSession: vi.fn() }))
vi.mock('@/lib/auth/session', () => ({ getSession }))

const { redirect } = vi.hoisted(() => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`redirect:${url}`)
  }),
}))
vi.mock('next/navigation', () => ({ redirect }))

const { getValidSession, requireApiSession, verifySession, SESSION_EXPIRED_PATH } =
  await import('./dal')

const token = { userId: 'user_1', role: 'USER' as const, sv: 2 }

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getValidSession', () => {
  it('returns null without a token, without querying the database', async () => {
    getSession.mockResolvedValue(null)
    await expect(getValidSession()).resolves.toBeNull()
    expect(findUnique).not.toHaveBeenCalled()
  })

  it('returns null when the user no longer exists', async () => {
    getSession.mockResolvedValue(token)
    findUnique.mockResolvedValue(null)
    await expect(getValidSession()).resolves.toBeNull()
  })

  it('returns null when the token was revoked (sessionVersion moved on)', async () => {
    getSession.mockResolvedValue(token)
    findUnique.mockResolvedValue({ role: 'USER', sessionVersion: 3 })
    await expect(getValidSession()).resolves.toBeNull()
  })

  it('returns the session with the role from the database', async () => {
    getSession.mockResolvedValue(token)
    findUnique.mockResolvedValue({ role: 'ADMIN', sessionVersion: 2 })
    await expect(getValidSession()).resolves.toEqual({ userId: 'user_1', role: 'ADMIN', sv: 2 })
    expect(findUnique.mock.calls[0][0]).toEqual({
      where: { id: 'user_1' },
      select: { role: true, sessionVersion: true },
    })
  })
})

describe('requireApiSession', () => {
  it('throws a 401 for a revoked token', async () => {
    getSession.mockResolvedValue(token)
    findUnique.mockResolvedValue({ role: 'USER', sessionVersion: 3 })
    const err = await requireApiSession().catch((e: unknown) => e)
    expect(err).toBeInstanceOf(ApiError)
    expect(err).toMatchObject({ status: 401, code: 'UNAUTHORIZED' })
  })
})

describe('verifySession', () => {
  it('sends a revoked session to the cookie-clearing route', async () => {
    getSession.mockResolvedValue(token)
    findUnique.mockResolvedValue({ role: 'USER', sessionVersion: 3 })
    await expect(verifySession()).rejects.toThrow(`redirect:${SESSION_EXPIRED_PATH}`)
  })
})
