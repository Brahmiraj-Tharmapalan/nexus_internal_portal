import 'server-only'

import type { Prisma } from '@/generated/prisma/client'
import { prisma } from '@/lib/db'
import { ApiError } from '@/lib/http'
import {
  taskIdSchema,
  type CreateTaskData,
  type TaskStatusValue,
  type UpdateTaskData,
} from '@/lib/validation/task'

/** Task fields sent to the client. Owner and assignee ids stay on the server. */
export const taskSelect = {
  id: true,
  title: true,
  description: true,
  status: true,
  priority: true,
  dueDate: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.TaskSelect

type TaskRow = Prisma.TaskGetPayload<{ select: typeof taskSelect }>

/**
 * A task as the client sees it. Dates are ISO strings, so Server Components (which call this
 * service directly) and API responses (JSON) give the client exactly the same shape.
 */
export type TaskDTO = Omit<TaskRow, 'dueDate' | 'createdAt' | 'updatedAt'> & {
  dueDate: string | null
  createdAt: string
  updatedAt: string
}

function toTaskDTO(task: TaskRow): TaskDTO {
  return {
    ...task,
    dueDate: task.dueDate?.toISOString() ?? null,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  }
}

function notFound(): ApiError {
  return new ApiError(404, 'NOT_FOUND', 'Task not found')
}

/** A malformed id can't match any task, so it is a 404 like any other unknown id. */
function assertTaskId(id: string): void {
  if (!taskIdSchema.safeParse(id).success) throw notFound()
}

/**
 * The user's tasks. Order: open work first (status in enum order TODO → IN_PROGRESS → DONE),
 * then by due date (soonest first, no date last), then newest first.
 */
export async function listTasks(userId: string): Promise<TaskDTO[]> {
  const tasks = await prisma.task.findMany({
    where: { createdById: userId },
    orderBy: [
      { status: 'asc' },
      { dueDate: { sort: 'asc', nulls: 'last' } },
      { createdAt: 'desc' },
    ],
    select: taskSelect,
  })
  return tasks.map(toTaskDTO)
}

export async function getTask(userId: string, id: string): Promise<TaskDTO> {
  assertTaskId(id)
  const task = await prisma.task.findFirst({
    where: { id, createdById: userId },
    select: taskSelect,
  })
  if (!task) throw notFound()
  return toTaskDTO(task)
}

export async function createTask(userId: string, data: CreateTaskData): Promise<TaskDTO> {
  const task = await prisma.task.create({
    data: {
      title: data.title,
      description: data.description,
      status: data.status,
      priority: data.priority,
      dueDate: data.dueDate,
      // Owner always comes from the session, never from the request body.
      createdById: userId,
    },
    select: taskSelect,
  })
  return toTaskDTO(task)
}

/** Updates in one query scoped by owner, so another user's task is never touched or revealed. */
async function updateOwnTask(
  userId: string,
  id: string,
  data: Prisma.TaskUpdateManyMutationInput,
): Promise<TaskDTO> {
  assertTaskId(id)
  const [task] = await prisma.task.updateManyAndReturn({
    where: { id, createdById: userId },
    data,
    select: taskSelect,
  })
  if (!task) throw notFound()
  return toTaskDTO(task)
}

export function updateTask(userId: string, id: string, data: UpdateTaskData): Promise<TaskDTO> {
  return updateOwnTask(userId, id, {
    title: data.title,
    description: data.description,
    status: data.status,
    priority: data.priority,
    dueDate: data.dueDate,
  })
}

export function updateTaskStatus(
  userId: string,
  id: string,
  status: TaskStatusValue,
): Promise<TaskDTO> {
  return updateOwnTask(userId, id, { status })
}

export async function deleteTask(userId: string, id: string): Promise<void> {
  assertTaskId(id)
  const { count } = await prisma.task.deleteMany({ where: { id, createdById: userId } })
  if (count === 0) throw notFound()
}
