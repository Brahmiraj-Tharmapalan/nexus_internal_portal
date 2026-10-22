import { createSession } from '@/lib/auth/session'
import { ApiError, assertSameOrigin, clientIp, handleRouteError, ok, readJson } from '@/lib/http'
import { assertWithinLimits, loginRules, recordHits, resetLimit } from '@/lib/rate-limit'
import { loginSchema } from '@/lib/validation/auth'
import { authenticate } from '@/server/auth/auth.service'

export async function POST(request: Request) {
  try {
    assertSameOrigin(request)
    const data = loginSchema.parse(await readJson(request))
    const rules = loginRules(clientIp(request), data.email)
    // Only failed logins count, so a user who types their password right is never blocked.
    await assertWithinLimits(rules)

    let session
    try {
      session = await authenticate(data)
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) await recordHits(rules)
      throw err
    }
    await resetLimit(rules[0].key)

    const { sessionVersion, ...user } = session
    await createSession({ userId: user.id, role: user.role, sv: sessionVersion })
    return ok({ user })
  } catch (err) {
    return handleRouteError(err)
  }
}
