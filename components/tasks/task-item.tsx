import { CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TaskDTO } from '@/server/tasks/task.service'
import { TaskActions } from './task-actions'
import { TaskStatusSelect } from './task-status-select'
import {
  PRIORITY_BADGE_CLASSES,
  PRIORITY_LABELS,
  PRIORITY_RULE_CLASSES,
  formatDueDate,
  isOverdue,
} from './task-meta'

export function TaskItem({ task, index = 0 }: { task: TaskDTO; index?: number }) {
  const done = task.status === 'DONE'
  const overdue = isOverdue(task.dueDate, task.status)

  return (
    <li
      className="animate-ledger relative flex flex-col gap-4 px-5 py-5 transition-colors hover:bg-accent/40 sm:flex-row sm:items-start sm:justify-between sm:px-7"
      style={{ '--i': Math.min(index, 12) } as React.CSSProperties}
    >
      <span
        aria-hidden
        className={cn('absolute inset-y-4 left-0 w-[3px] rounded-r-full', PRIORITY_RULE_CLASSES[task.priority])}
      />
      <div className={cn('flex min-w-0 flex-1 flex-col gap-2', done && 'opacity-70')}>
        <h3
          className={cn(
            'font-display text-[1.4rem] leading-tight break-words text-leather',
            done && 'line-through decoration-brass decoration-2',
          )}
        >
          {task.title}
        </h3>
        {task.description && (
          <p className="line-clamp-2 max-w-prose text-[0.95rem] leading-relaxed break-words text-muted-foreground">
            {task.description}
          </p>
        )}
        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs">
          <span
            className={cn(
              'inline-flex h-6 items-center rounded-full border px-2.5 font-medium',
              PRIORITY_BADGE_CLASSES[task.priority],
            )}
          >
            {PRIORITY_LABELS[task.priority]} priority
          </span>
          {task.dueDate && (
            <span
              className={cn(
                'inline-flex items-center gap-1.5 text-muted-foreground',
                overdue && 'font-medium text-garnet',
              )}
            >
              <CalendarIcon className="size-3.5" aria-hidden />
              <time dateTime={task.dueDate.slice(0, 10)}>{formatDueDate(task.dueDate)}</time>
              {overdue && <span>(overdue)</span>}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 sm:shrink-0">
        <TaskStatusSelect taskId={task.id} taskTitle={task.title} status={task.status} />
        <TaskActions task={task} />
      </div>
    </li>
  )
}
