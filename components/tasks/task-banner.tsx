import { GUILLOCHE } from '@/components/brand/patterns'
import type { TaskDTO } from '@/server/tasks/task.service'
import { NewTaskButton } from './new-task-button'
import { TaskTally } from './task-tally'

/** The green leather banner at the top of the tasks page. */
export function TaskBanner({ firstName, tasks }: { firstName: string | null; tasks: TaskDTO[] }) {
  return (
    <header className="relative overflow-hidden rounded-2xl bg-leather text-leather-foreground shadow-[0_24px_48px_-28px_rgba(18,58,46,0.7)]">
      <div aria-hidden className="absolute inset-0" style={GUILLOCHE} />
      <div aria-hidden className="absolute inset-2.5 rounded-xl border border-champagne/30" />
      <div className="relative flex flex-col gap-8 px-7 py-9 sm:flex-row sm:items-end sm:justify-between sm:px-10 sm:py-11">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            {firstName && <p className="text-[0.95rem] text-champagne">Welcome back, {firstName}</p>}
            <h1 className="font-display text-5xl leading-none text-white sm:text-6xl">My tasks</h1>
          </div>
          {tasks.length > 0 && <TaskTally tasks={tasks} />}
        </div>
        {tasks.length > 0 && <NewTaskButton tone="champagne" />}
      </div>
    </header>
  )
}
