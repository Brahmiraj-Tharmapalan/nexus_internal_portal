import 'server-only'

import { prisma } from '@/lib/db'
import { ApiError } from '@/lib/http'

/** At most `limit` hits per `windowSeconds` for one key. */
export type RateLimitRule = {
  key: string
  limit: number
  windowSeconds: number
}

type Counter = { count: number; windowStart: Date }

/**
 * Adds one hit to the key's fixed window in a single atomic upsert, starting a new window
 * when the old one has passed. Stored in Postgres so every serverless instance shares it.
 */
async function hit({ key, windowSeconds }: RateLimitRule): Promise<Counter> {
  const [row] = await prisma.$queryRaw<Counter[]>`
    INSERT INTO "RateLimit" ("key", "count", "windowStart")
    VALUES (${key}, 1, now())
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE
        WHEN "RateLimit"."windowStart" <= now() - make_interval(secs => ${windowSeconds}) THEN 1
        ELSE "RateLimit"."count" + 1
      END,
      "windowStart" = CASE
        WHEN "RateLimit"."windowStart" <= now() - make_interval(secs => ${windowSeconds}) THEN now()
        ELSE "RateLimit"."windowStart"
      END
    RETURNING "count", "windowStart"`
  return row
}

/** The key's hit count in its current window, without adding one. */
async function peek({ key, windowSeconds }: RateLimitRule): Promise<Counter | null> {
  const row = await prisma.rateLimit.findUnique({
    where: { key },
    select: { count: true, windowStart: true },
  })
  if (!row || row.windowStart.getTime() + windowSeconds * 1000 <= Date.now()) return null
  return row
}

function tooManyRequests(rule: RateLimitRule, windowStart: Date): ApiError {
  const resetMs = windowStart.getTime() + rule.windowSeconds * 1000 - Date.now()
  const retryAfter = Math.max(1, Math.ceil(resetMs / 1000))
  return new ApiError(
    429,
    'TOO_MANY_REQUESTS',
    'Too many attempts. Please try again later.',
    { retryAfter },
    { 'Retry-After': String(retryAfter) },
  )
}

/** Throws a 429 if any rule is already at its limit. Does not count this request. */
export async function assertWithinLimits(rules: RateLimitRule[]): Promise<void> {
  const counters = await Promise.all(rules.map(peek))
  rules.forEach((rule, i) => {
    const counter = counters[i]
    if (counter && counter.count >= rule.limit) throw tooManyRequests(rule, counter.windowStart)
  })
}

/** Counts this request against every rule. */
export async function recordHits(rules: RateLimitRule[]): Promise<void> {
  await Promise.all(rules.map(hit))
}

/** Counts this request, then throws a 429 if any rule went over its limit. */
export async function consume(rules: RateLimitRule[]): Promise<void> {
  const counters = await Promise.all(rules.map(hit))
  rules.forEach((rule, i) => {
    if (counters[i].count > rule.limit) throw tooManyRequests(rule, counters[i].windowStart)
  })
}

/** Forgets a key, e.g. the per-account failure count after a successful login. */
export async function resetLimit(key: string): Promise<void> {
  await prisma.rateLimit.deleteMany({ where: { key } })
}

const FIFTEEN_MINUTES = 15 * 60
const ONE_HOUR = 60 * 60

/** Failed logins: 5 per account from one IP, 20 per IP overall, per 15 minutes. */
export function loginRules(ip: string, email: string): RateLimitRule[] {
  return [
    { key: `login:account:${ip}:${email}`, limit: 5, windowSeconds: FIFTEEN_MINUTES },
    { key: `login:ip:${ip}`, limit: 20, windowSeconds: FIFTEEN_MINUTES },
  ]
}

/** Sign-up attempts: 5 per IP per hour. */
export function registerRules(ip: string): RateLimitRule[] {
  return [{ key: `register:ip:${ip}`, limit: 5, windowSeconds: ONE_HOUR }]
}
