import { describe, expect, it } from 'vitest'
import { TaskPriority, TaskStatus } from '@/generated/prisma/enums'
import {
  createTaskSchema,
  TASK_PRIORITIES,
  TASK_STATUSES,
  taskIdSchema,
  taskStatusSchema,
  updateTaskSchema,
} from './task'

function issuePaths(result: { error?: { issues: { path: PropertyKey[] }[] } }) {
  return (result.error?.issues ?? []).map((issue) => issue.path.join('.'))
}

describe('enum tuples', () => {
  it('match the Prisma enums', () => {
    expect(TASK_STATUSES).toEqual(Object.values(TaskStatus))
    expect(TASK_PRIORITIES).toEqual(Object.values(TaskPriority))
  })
})

describe('createTaskSchema', () => {
  it('applies defaults and trims the title', () => {
    expect(createTaskSchema.parse({ title: '  Write docs  ' })).toEqual({
      title: 'Write docs',
      status: 'TODO',
      priority: 'MEDIUM',
    })
  })

  it('rejects an empty title and a title over 120 characters', () => {
    expect(issuePaths(createTaskSchema.safeParse({ title: '   ' }))).toContain('title')
    expect(issuePaths(createTaskSchema.safeParse({ title: 'a'.repeat(121) }))).toContain('title')
    expect(createTaskSchema.safeParse({ title: 'a'.repeat(120) }).success).toBe(true)
  })

  it('turns an empty description into null and rejects one over 2000 characters', () => {
    expect(createTaskSchema.parse({ title: 't', description: '   ' }).description).toBeNull()
    expect(createTaskSchema.parse({ title: 't', description: null }).description).toBeNull()
    expect(createTaskSchema.parse({ title: 't', description: ' Hi ' }).description).toBe('Hi')
    expect(
      issuePaths(createTaskSchema.safeParse({ title: 't', description: 'a'.repeat(2001) })),
    ).toContain('description')
  })

  it('coerces YYYY-MM-DD and ISO datetimes to Date, and empty/null to null', () => {
    expect(createTaskSchema.parse({ title: 't', dueDate: '2026-11-05' }).dueDate).toEqual(
      new Date('2026-11-05T00:00:00.000Z'),
    )
    expect(
      createTaskSchema.parse({ title: 't', dueDate: '2026-11-05T10:30:00+02:00' }).dueDate,
    ).toEqual(new Date('2026-11-05T08:30:00.000Z'))
    expect(createTaskSchema.parse({ title: 't', dueDate: '' }).dueDate).toBeNull()
    expect(createTaskSchema.parse({ title: 't', dueDate: null }).dueDate).toBeNull()
  })

  it.each(['tomorrow', '2026-13-01', '2026-02-30', 12345])('rejects due date %s', (dueDate) => {
    expect(issuePaths(createTaskSchema.safeParse({ title: 't', dueDate }))).toContain('dueDate')
  })

  it('rejects unknown status and priority values', () => {
    const result = createTaskSchema.safeParse({ title: 't', status: 'BLOCKED', priority: 'URGENT' })
    expect(issuePaths(result)).toEqual(expect.arrayContaining(['status', 'priority']))
  })

  it.each(['createdById', 'assigneeId', 'id'])('rejects client-set %s', (key) => {
    expect(createTaskSchema.safeParse({ title: 't', [key]: 'user_2' }).success).toBe(false)
  })
})

describe('updateTaskSchema', () => {
  it('accepts a partial update without applying defaults', () => {
    expect(updateTaskSchema.parse({ priority: 'HIGH' })).toEqual({ priority: 'HIGH' })
  })

  it('allows clearing description and due date with null', () => {
    expect(updateTaskSchema.parse({ description: null, dueDate: null })).toEqual({
      description: null,
      dueDate: null,
    })
  })

  it('requires at least one field', () => {
    expect(updateTaskSchema.safeParse({}).success).toBe(false)
  })

  it('rejects an empty title and unknown keys', () => {
    expect(issuePaths(updateTaskSchema.safeParse({ title: '' }))).toContain('title')
    expect(updateTaskSchema.safeParse({ title: 't', createdById: 'user_2' }).success).toBe(false)
  })
})

describe('taskStatusSchema', () => {
  it('accepts a valid status and rejects others or extra keys', () => {
    expect(taskStatusSchema.parse({ status: 'DONE' })).toEqual({ status: 'DONE' })
    expect(taskStatusSchema.safeParse({ status: 'done' }).success).toBe(false)
    expect(taskStatusSchema.safeParse({}).success).toBe(false)
    expect(taskStatusSchema.safeParse({ status: 'DONE', title: 'x' }).success).toBe(false)
  })
})

describe('taskIdSchema', () => {
  it.each(['cmh1x2y3z0000abcd1234efgh', 'seed-task-1'])('accepts %s', (id) => {
    expect(taskIdSchema.safeParse(id).success).toBe(true)
  })

  it.each(['', 'a b', '../etc', 'x'.repeat(65)])('rejects %j', (id) => {
    expect(taskIdSchema.safeParse(id).success).toBe(false)
  })
})
