import { createSession } from '@/lib/auth/session'
import { assertSameOrigin, handleRouteError, ok, readJson } from '@/lib/http'
import { loginSchema } from '@/lib/validation/auth'
import { authenticate } from '@/server/auth/auth.service'

export async function POST(request: Request) {
  try {
    assertSameOrigin(request)
    const data = loginSchema.parse(await readJson(request))
    const user = await authenticate(data)
    await createSession(user.id, user.role)
    return ok({ user })
  } catch (err) {
    return handleRouteError(err)
  }
}
