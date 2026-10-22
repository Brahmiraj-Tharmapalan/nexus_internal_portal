import { CalendarIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { TaskDTO } from '@/server/tasks/task.service'
import { TaskActions } from './task-actions'
import { TaskStatusSelect } from './task-status-select'
import { PRIORITY_BADGE_CLASSES, PRIORITY_LABELS, formatDueDate, isOverdue } from './task-meta'

export function TaskItem({ task }: { task: TaskDTO }) {
  const done = task.status === 'DONE'
  const overdue = isOverdue(task.dueDate, task.status)

  return (
    <li
      className={cn(
        'flex flex-col gap-3 rounded-xl border bg-background p-4 sm:flex-row sm:items-start sm:justify-between',
        done && 'bg-muted/50',
      )}
    >
      <div className={cn('flex min-w-0 flex-1 flex-col gap-2', done && 'opacity-60')}>
        <h3 className={cn('font-medium break-words', done && 'line-through')}>{task.title}</h3>
        {task.description && (
          <p className="line-clamp-2 text-sm break-words text-muted-foreground">{task.description}</p>
        )}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Badge className={PRIORITY_BADGE_CLASSES[task.priority]}>
            {PRIORITY_LABELS[task.priority]} priority
          </Badge>
          {task.dueDate && (
            <span
              className={cn(
                'inline-flex items-center gap-1 text-muted-foreground',
                overdue && 'font-medium text-destructive',
              )}
            >
              <CalendarIcon className="size-3.5" aria-hidden />
              <time dateTime={task.dueDate.slice(0, 10)}>{formatDueDate(task.dueDate)}</time>
              {overdue && <span>· Overdue</span>}
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
