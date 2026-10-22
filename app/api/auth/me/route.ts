import { getUserById, requireApiSession } from '@/lib/auth/dal'
import { ApiError, handleRouteError, ok } from '@/lib/http'

export async function GET() {
  try {
    const { userId } = await requireApiSession()
    const user = await getUserById(userId)
    if (!user) {
      // Valid token, but the account was deleted.
      throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required')
    }
    return ok({ user })
  } catch (err) {
    return handleRouteError(err)
  }
}
