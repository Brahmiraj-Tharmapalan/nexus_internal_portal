import { NextResponse } from 'next/server'
import { requireApiSession } from '@/lib/auth/dal'
import { assertSameOrigin, handleRouteError, ok, readJson } from '@/lib/http'
import { updateTaskSchema } from '@/lib/validation/task'
import { deleteTask, getTask, updateTask } from '@/server/tasks/task.service'

type Context = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: Context) {
  try {
    const { userId } = await requireApiSession()
    const { id } = await params
    const task = await getTask(userId, id)
    return ok({ task })
  } catch (err) {
    return handleRouteError(err)
  }
}

export async function PATCH(request: Request, { params }: Context) {
  try {
    assertSameOrigin(request)
    const { userId } = await requireApiSession()
    const { id } = await params
    const data = updateTaskSchema.parse(await readJson(request))
    const task = await updateTask(userId, id, data)
    return ok({ task })
  } catch (err) {
    return handleRouteError(err)
  }
}

export async function DELETE(request: Request, { params }: Context) {
  try {
    assertSameOrigin(request)
    const { userId } = await requireApiSession()
    const { id } = await params
    await deleteTask(userId, id)
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    return handleRouteError(err)
  }
}
