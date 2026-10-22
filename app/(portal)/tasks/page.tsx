import type { Metadata } from 'next'
import { NewTaskButton } from '@/components/tasks/new-task-button'
import { TaskList } from '@/components/tasks/task-list'
import { verifySession } from '@/lib/auth/dal'
import { listTasks } from '@/server/tasks/task.service'

export const metadata: Metadata = { title: 'Tasks · Internal Task Portal' }

export default async function TasksPage() {
  const { userId } = await verifySession()
  const tasks = await listTasks(userId)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">My tasks</h1>
          <p className="text-sm text-muted-foreground">
            {tasks.length === 1 ? '1 task' : `${tasks.length} tasks`}
          </p>
        </div>
        {tasks.length > 0 && <NewTaskButton />}
      </div>
      <TaskList tasks={tasks} />
    </div>
  )
}
