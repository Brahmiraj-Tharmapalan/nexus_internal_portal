import { cn } from '@/lib/utils'
import type { TaskStatusValue } from '@/lib/validation/task'
import type { TaskDTO } from '@/server/tasks/task.service'
import { STATUS_ITEMS } from './task-meta'

// Dot colours tuned for the dark green banner.
const DOT: Record<TaskStatusValue, string> = {
  TODO: 'border border-white/70',
  IN_PROGRESS: 'bg-champagne',
  DONE: 'bg-white',
}

/** How many tasks sit in each status, shown as chips in the banner. */
export function TaskTally({ tasks }: { tasks: TaskDTO[] }) {
  return (
    <dl className="flex flex-wrap gap-2">
      {STATUS_ITEMS.map(({ value, label }) => (
        <div
          key={value}
          className="flex items-center gap-2 rounded-full bg-white/[0.07] py-1.5 pr-3.5 pl-3 text-sm ring-1 ring-white/15"
        >
          <span aria-hidden className={cn('size-2 rounded-full', DOT[value])} />
          <dt className="text-white/85">{label}</dt>
          <dd className="font-semibold text-white tabular-nums">
            {tasks.filter((t) => t.status === value).length}
          </dd>
        </div>
      ))}
    </dl>
  )
}
