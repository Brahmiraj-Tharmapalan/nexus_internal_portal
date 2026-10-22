import type { Metadata } from 'next'
import { TaskBanner } from '@/components/tasks/task-banner'
import { TaskList } from '@/components/tasks/task-list'
import { getCurrentUser, verifySession } from '@/lib/auth/dal'
import { listTasks } from '@/server/tasks/task.service'

export const metadata: Metadata = { title: 'Tasks · Nexus' }

export default async function TasksPage() {
  const { userId } = await verifySession()
  const [tasks, user] = await Promise.all([listTasks(userId), getCurrentUser()])
  const firstName = user?.name.trim().split(/\s+/)[0] ?? null

  return (
    <div className="flex flex-col gap-8">
      <TaskBanner firstName={firstName} tasks={tasks} />
      <TaskList tasks={tasks} />
    </div>
  )
}
