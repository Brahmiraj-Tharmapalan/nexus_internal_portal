import { ClipboardListIcon } from 'lucide-react'
import { NewTaskButton } from './new-task-button'

export function TaskEmptyState() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed bg-background px-6 py-12 text-center">
      <ClipboardListIcon className="size-10 text-muted-foreground" aria-hidden />
      <div className="flex flex-col gap-1">
        <h2 className="font-medium">No tasks yet</h2>
        <p className="text-sm text-muted-foreground">Create your first task to get started.</p>
      </div>
      <NewTaskButton label="Create your first task" />
    </div>
  )
}
