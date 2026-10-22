import { createSession } from '@/lib/auth/session'
import { assertSameOrigin, handleRouteError, ok, readJson } from '@/lib/http'
import { registerSchema } from '@/lib/validation/auth'
import { registerUser } from '@/server/auth/auth.service'

export async function POST(request: Request) {
  try {
    assertSameOrigin(request)
    const data = registerSchema.parse(await readJson(request))
    const user = await registerUser(data)
    await createSession(user.id, user.role)
    return ok({ user }, 201)
  } catch (err) {
    return handleRouteError(err)
  }
}
