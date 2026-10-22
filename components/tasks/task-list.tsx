import type { TaskDTO } from '@/server/tasks/task.service'
import { TaskEmptyState } from './task-empty-state'
import { TaskItem } from './task-item'

/** All tasks on one ruled sheet, newest first. */
export function TaskList({ tasks }: { tasks: TaskDTO[] }) {
  if (tasks.length === 0) return <TaskEmptyState />

  return (
    <ul
      className="divide-y divide-border/80 overflow-hidden rounded-xl bg-card shadow-[0_1px_0_rgba(18,58,46,0.04),0_12px_32px_-18px_rgba(18,58,46,0.22)] ring-1 ring-border"
      aria-label="Tasks"
    >
      {tasks.map((task, i) => (
        <TaskItem key={task.id} task={task} index={i} />
      ))}
    </ul>
  )
}
