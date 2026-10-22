import { createSession } from '@/lib/auth/session'
import { assertSameOrigin, clientIp, handleRouteError, ok, readJson } from '@/lib/http'
import { consume, registerRules } from '@/lib/rate-limit'
import { registerSchema } from '@/lib/validation/auth'
import { registerUser } from '@/server/auth/auth.service'

export async function POST(request: Request) {
  try {
    assertSameOrigin(request)
    const data = registerSchema.parse(await readJson(request))
    // Counted after validation, so typos in the form don't use up attempts.
    await consume(registerRules(clientIp(request)))
    const { sessionVersion, ...user } = await registerUser(data)
    await createSession({ userId: user.id, role: user.role, sv: sessionVersion })
    return ok({ user }, 201)
  } catch (err) {
    return handleRouteError(err)
  }
}
