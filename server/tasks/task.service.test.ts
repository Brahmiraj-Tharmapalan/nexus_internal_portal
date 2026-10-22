import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/lib/http'
import type { CreateTaskData } from '@/lib/validation/task'

const { findMany, findFirst, create, updateManyAndReturn, deleteMany } = vi.hoisted(() => ({
  findMany: vi.fn(),
  findFirst: vi.fn(),
  create: vi.fn(),
  updateManyAndReturn: vi.fn(),
  deleteMany: vi.fn(),
}))
vi.mock('@/lib/db', () => ({
  prisma: { task: { findMany, findFirst, create, updateManyAndReturn, deleteMany } },
}))

const { createTask, deleteTask, getTask, listTasks, updateTask, updateTaskStatus } =
  await import('./task.service')

const USER_ID = 'user_1'
const TASK_ID = 'task_1'

const row = {
  id: TASK_ID,
  title: 'Write docs',
  description: null,
  status: 'TODO' as const,
  priority: 'MEDIUM' as const,
  dueDate: new Date('2026-11-05T00:00:00.000Z'),
  createdAt: new Date('2026-10-01T09:00:00.000Z'),
  updatedAt: new Date('2026-10-02T09:00:00.000Z'),
}

const dto = {
  ...row,
  dueDate: '2026-11-05T00:00:00.000Z',
  createdAt: '2026-10-01T09:00:00.000Z',
  updatedAt: '2026-10-02T09:00:00.000Z',
}

async function expectNotFound(promise: Promise<unknown>) {
  const err = await promise.catch((e: unknown) => e)
  expect(err).toBeInstanceOf(ApiError)
  expect(err).toMatchObject({ status: 404, code: 'NOT_FOUND', message: 'Task not found' })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('listTasks', () => {
  it('lists only the user tasks, open first, as DTOs with ISO dates', async () => {
    findMany.mockResolvedValue([row, { ...row, id: 'task_2', dueDate: null }])
    const tasks = await listTasks(USER_ID)

    expect(tasks).toEqual([dto, { ...dto, id: 'task_2', dueDate: null }])
    const args = findMany.mock.calls[0][0]
    expect(args.where).toEqual({ createdById: USER_ID })
    expect(args.orderBy[0]).toEqual({ status: 'asc' })
    expect(args.select).not.toHaveProperty('createdById')
    expect(args.select).not.toHaveProperty('assigneeId')
  })
})

describe('getTask', () => {
  it('scopes the lookup by owner', async () => {
    findFirst.mockResolvedValue(row)
    await expect(getTask(USER_ID, TASK_ID)).resolves.toEqual(dto)
    expect(findFirst.mock.calls[0][0].where).toEqual({ id: TASK_ID, createdById: USER_ID })
  })

  it('throws 404 when the task is missing or owned by someone else', async () => {
    findFirst.mockResolvedValue(null)
    await expectNotFound(getTask(USER_ID, TASK_ID))
  })

  it('throws 404 for a malformed id without querying', async () => {
    await expectNotFound(getTask(USER_ID, '../nope'))
    expect(findFirst).not.toHaveBeenCalled()
  })
})

describe('createTask', () => {
  it('sets createdById from the session user, not from input', async () => {
    create.mockResolvedValue(row)
    // Not allowed by the schema; make sure the service ignores it even if it slipped through.
    const input = {
      title: 'Write docs',
      status: 'TODO',
      priority: 'MEDIUM',
      createdById: 'attacker',
      assigneeId: 'attacker',
    } as CreateTaskData
    await expect(createTask(USER_ID, input)).resolves.toEqual(dto)

    const args = create.mock.calls[0][0]
    expect(args.data.createdById).toBe(USER_ID)
    expect(args.data).not.toHaveProperty('assigneeId')
  })
})

describe('updateTask', () => {
  it('updates in one query scoped by owner and returns the DTO', async () => {
    updateManyAndReturn.mockResolvedValue([{ ...row, title: 'New' }])
    await expect(updateTask(USER_ID, TASK_ID, { title: 'New' })).resolves.toEqual({
      ...dto,
      title: 'New',
    })
    const args = updateManyAndReturn.mock.calls[0][0]
    expect(args.where).toEqual({ id: TASK_ID, createdById: USER_ID })
    expect(args.data.title).toBe('New')
    expect(args.data).not.toHaveProperty('createdById')
  })

  it('throws 404 when nothing matched', async () => {
    updateManyAndReturn.mockResolvedValue([])
    await expectNotFound(updateTask(USER_ID, TASK_ID, { title: 'New' }))
  })
})

describe('updateTaskStatus', () => {
  it('changes only the status, scoped by owner', async () => {
    updateManyAndReturn.mockResolvedValue([{ ...row, status: 'DONE' }])
    await expect(updateTaskStatus(USER_ID, TASK_ID, 'DONE')).resolves.toMatchObject({
      status: 'DONE',
    })
    const args = updateManyAndReturn.mock.calls[0][0]
    expect(args.where).toEqual({ id: TASK_ID, createdById: USER_ID })
    expect(args.data).toEqual({ status: 'DONE' })
  })

  it('throws 404 when nothing matched', async () => {
    updateManyAndReturn.mockResolvedValue([])
    await expectNotFound(updateTaskStatus(USER_ID, TASK_ID, 'DONE'))
  })
})

describe('deleteTask', () => {
  it('deletes scoped by owner', async () => {
    deleteMany.mockResolvedValue({ count: 1 })
    await expect(deleteTask(USER_ID, TASK_ID)).resolves.toBeUndefined()
    expect(deleteMany.mock.calls[0][0].where).toEqual({ id: TASK_ID, createdById: USER_ID })
  })

  it('throws 404 when count is 0', async () => {
    deleteMany.mockResolvedValue({ count: 0 })
    await expectNotFound(deleteTask(USER_ID, TASK_ID))
  })
})
