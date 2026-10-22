import { requireApiSession } from '@/lib/auth/dal'
import { assertSameOrigin, handleRouteError, ok, readJson } from '@/lib/http'
import { createTaskSchema } from '@/lib/validation/task'
import { createTask, listTasks } from '@/server/tasks/task.service'

export async function GET() {
  try {
    const { userId } = await requireApiSession()
    const tasks = await listTasks(userId)
    return ok({ tasks })
  } catch (err) {
    return handleRouteError(err)
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request)
    const { userId } = await requireApiSession()
    const data = createTaskSchema.parse(await readJson(request))
    const task = await createTask(userId, data)
    return ok({ task }, 201)
  } catch (err) {
    return handleRouteError(err)
  }
}
