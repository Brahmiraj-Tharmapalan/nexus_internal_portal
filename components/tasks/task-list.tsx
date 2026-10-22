import type { TaskDTO } from '@/server/tasks/task.service'
import { TaskEmptyState } from './task-empty-state'
import { TaskItem } from './task-item'

export function TaskList({ tasks }: { tasks: TaskDTO[] }) {
  if (tasks.length === 0) return <TaskEmptyState />

  return (
    <ul className="flex flex-col gap-3" aria-label="Tasks">
      {tasks.map((task) => (
        <TaskItem key={task.id} task={task} />
      ))}
    </ul>
  )
}
