import { requireApiSession } from '@/lib/auth/dal'
import { assertSameOrigin, handleRouteError, ok, readJson } from '@/lib/http'
import { taskStatusSchema } from '@/lib/validation/task'
import { updateTaskStatus } from '@/server/tasks/task.service'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request)
    const { userId } = await requireApiSession()
    const { id } = await params
    const { status } = taskStatusSchema.parse(await readJson(request))
    const task = await updateTaskStatus(userId, id, status)
    return ok({ task })
  } catch (err) {
    return handleRouteError(err)
  }
}
