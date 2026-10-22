import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/lib/http'

const { queryRaw, findUnique, deleteMany } = vi.hoisted(() => ({
  queryRaw: vi.fn(),
  findUnique: vi.fn(),
  deleteMany: vi.fn(),
}))
vi.mock('@/lib/db', () => ({
  prisma: { $queryRaw: queryRaw, rateLimit: { findUnique, deleteMany } },
}))

const { assertWithinLimits, consume, loginRules, recordHits, registerRules, resetLimit } =
  await import('./rate-limit')

const rule = { key: 'k', limit: 3, windowSeconds: 60 }
const secondsAgo = (s: number) => new Date(Date.now() - s * 1000)

async function caught(promise: Promise<unknown>): Promise<ApiError> {
  const err = await promise.catch((e: unknown) => e)
  expect(err).toBeInstanceOf(ApiError)
  return err as ApiError
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('consume', () => {
  it('allows hits up to the limit', async () => {
    queryRaw.mockResolvedValue([{ count: 3, windowStart: secondsAgo(10) }])
    await expect(consume([rule])).resolves.toBeUndefined()
    expect(queryRaw).toHaveBeenCalledTimes(1)
  })

  it('throws a 429 with Retry-After once the limit is passed', async () => {
    queryRaw.mockResolvedValue([{ count: 4, windowStart: secondsAgo(10) }])
    const err = await caught(consume([rule]))
    expect(err).toMatchObject({ status: 429, code: 'TOO_MANY_REQUESTS' })
    // 60s window, 10s in: about 50s left.
    const retryAfter = Number(err.headers?.['Retry-After'])
    expect(retryAfter).toBeGreaterThanOrEqual(49)
    expect(retryAfter).toBeLessThanOrEqual(50)
    expect(err.details).toEqual({ retryAfter })
  })

  it('passes the key and window to the atomic upsert', async () => {
    queryRaw.mockResolvedValue([{ count: 1, windowStart: new Date() }])
    await consume([rule])
    const values = queryRaw.mock.calls[0].slice(1)
    expect(values).toContain('k')
    expect(values).toContain(60)
  })
})

describe('assertWithinLimits', () => {
  it('passes when there is no counter yet', async () => {
    findUnique.mockResolvedValue(null)
    await expect(assertWithinLimits([rule])).resolves.toBeUndefined()
    expect(queryRaw).not.toHaveBeenCalled()
  })

  it('passes below the limit', async () => {
    findUnique.mockResolvedValue({ count: 2, windowStart: secondsAgo(10) })
    await expect(assertWithinLimits([rule])).resolves.toBeUndefined()
  })

  it('throws a 429 at the limit', async () => {
    findUnique.mockResolvedValue({ count: 3, windowStart: secondsAgo(10) })
    expect(await caught(assertWithinLimits([rule]))).toMatchObject({ status: 429 })
  })

  it('ignores a counter whose window has passed', async () => {
    findUnique.mockResolvedValue({ count: 99, windowStart: secondsAgo(61) })
    await expect(assertWithinLimits([rule])).resolves.toBeUndefined()
  })
})

describe('recordHits / resetLimit', () => {
  it('counts one hit per rule', async () => {
    queryRaw.mockResolvedValue([{ count: 1, windowStart: new Date() }])
    await recordHits(loginRules('1.2.3.4', 'ada@example.com'))
    expect(queryRaw).toHaveBeenCalledTimes(2)
  })

  it('deletes the key', async () => {
    await resetLimit('k')
    expect(deleteMany).toHaveBeenCalledWith({ where: { key: 'k' } })
  })
})

describe('rules', () => {
  it('limits login per account+IP and per IP', () => {
    expect(loginRules('1.2.3.4', 'ada@example.com')).toEqual([
      { key: 'login:account:1.2.3.4:ada@example.com', limit: 5, windowSeconds: 900 },
      { key: 'login:ip:1.2.3.4', limit: 20, windowSeconds: 900 },
    ])
  })

  it('limits sign-ups per IP per hour', () => {
    expect(registerRules('1.2.3.4')).toEqual([
      { key: 'register:ip:1.2.3.4', limit: 5, windowSeconds: 3600 },
    ])
  })
})
