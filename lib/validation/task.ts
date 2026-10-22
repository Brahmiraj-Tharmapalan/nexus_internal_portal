import { z } from 'zod'
// Plain const objects with no imports, so this is safe in the client bundle.
import { TaskPriority, TaskStatus } from '@/generated/prisma/enums'

// Shared by client forms and API routes, so no 'server-only' here.

export const taskStatusEnum = z.enum(TaskStatus)
export const taskPriorityEnum = z.enum(TaskPriority)

export const TASK_STATUSES = taskStatusEnum.options
export const TASK_PRIORITIES = taskPriorityEnum.options

const title = z
  .string()
  .trim()
  .min(1, 'Title is required')
  .max(120, 'Title must be at most 120 characters')

// Empty (or whitespace-only) description is stored as null.
const description = z
  .string()
  .trim()
  .max(2000, 'Description must be at most 2000 characters')
  .transform((value) => (value === '' ? null : value))
  .nullable()

// Accepts `YYYY-MM-DD` (stored as UTC midnight) or a full ISO datetime with offset.
// Empty string (cleared date input) and null both mean "no due date".
const dueDate = z
  .union([z.literal(''), z.iso.date(), z.iso.datetime({ offset: true })], {
    error: 'Enter a valid date (YYYY-MM-DD)',
  })
  .transform((value) => (value === '' ? null : new Date(value)))
  .nullable()

// Strict objects: clients can never set createdById, assigneeId or any other field.
export const createTaskSchema = z.strictObject({
  title,
  description: description.optional(),
  status: taskStatusEnum.default('TODO'),
  priority: taskPriorityEnum.default('MEDIUM'),
  dueDate: dueDate.optional(),
})

export const updateTaskSchema = z
  .strictObject({
    title: title.optional(),
    description: description.optional(),
    status: taskStatusEnum.optional(),
    priority: taskPriorityEnum.optional(),
    dueDate: dueDate.optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    error: 'Provide at least one field to update',
  })

export const taskStatusSchema = z.strictObject({ status: taskStatusEnum })

// Ids are cuids, but seed data uses readable ids like `seed-task-1`, so allow any short safe slug.
export const taskIdSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[A-Za-z0-9_-]+$/)

export type TaskStatusValue = z.infer<typeof taskStatusEnum>
export type TaskPriorityValue = z.infer<typeof taskPriorityEnum>
export type CreateTaskInput = z.input<typeof createTaskSchema>
export type CreateTaskData = z.output<typeof createTaskSchema>
export type UpdateTaskData = z.output<typeof updateTaskSchema>
