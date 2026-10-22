import type { TaskPriorityValue, TaskStatusValue } from '@/lib/validation/task'
import { TASK_PRIORITIES, TASK_STATUSES } from '@/lib/validation/task'

// Labels and colours for task status and priority, kept in one place.

export const STATUS_LABELS: Record<TaskStatusValue, string> = {
  TODO: 'To do',
  IN_PROGRESS: 'In progress',
  DONE: 'Done',
}

export const PRIORITY_LABELS: Record<TaskPriorityValue, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
}

export const PRIORITY_BADGE_CLASSES: Record<TaskPriorityValue, string> = {
  LOW: 'border-border text-muted-foreground',
  MEDIUM: 'border-brass/50 bg-brass-soft/50 text-[#6e5427]',
  HIGH: 'border-garnet/35 bg-garnet/[0.06] text-garnet',
}

/** The thin rule on a task row's left edge. */
export const PRIORITY_RULE_CLASSES: Record<TaskPriorityValue, string> = {
  LOW: 'bg-border',
  MEDIUM: 'bg-brass',
  HIGH: 'bg-garnet',
}

export const STATUS_DOT_CLASSES: Record<TaskStatusValue, string> = {
  TODO: 'border border-muted-foreground/60',
  IN_PROGRESS: 'bg-brass',
  DONE: 'bg-leather',
}

/** `items` for base-ui Select, so the trigger shows the label instead of the raw value. */
export const STATUS_ITEMS = TASK_STATUSES.map((value) => ({ value, label: STATUS_LABELS[value] }))
export const PRIORITY_ITEMS = TASK_PRIORITIES.map((value) => ({
  value,
  label: PRIORITY_LABELS[value],
}))

// Due dates are calendar dates stored as UTC midnight, so they are formatted and compared in UTC.
// A fixed locale and time zone keep server and client output identical.
const dueDateFormat = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

export function formatDueDate(iso: string): string {
  return dueDateFormat.format(new Date(iso))
}

/** `YYYY-MM-DD` for `<input type="date">`. */
export function toDateInputValue(iso: string | null): string {
  return iso ? iso.slice(0, 10) : ''
}

export function isOverdue(dueDate: string | null, status: TaskStatusValue, now = new Date()): boolean {
  if (!dueDate || status === 'DONE') return false
  return dueDate.slice(0, 10) < now.toISOString().slice(0, 10)
}
