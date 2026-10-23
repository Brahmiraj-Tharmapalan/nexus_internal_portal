import { PencilIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { TaskDTO } from '@/server/tasks/task.service'
import { DeleteTaskDialog } from './delete-task-dialog'
import { TaskFormDialog } from './task-form-dialog'

/** Edit and delete buttons for one task. */
export function TaskActions({ task }: { task: TaskDTO }) {
  return (
    <>
      <TaskFormDialog
        task={task}
        trigger={
          <Button variant="ghost" size="icon-sm" aria-label={`Edit “${task.title}”`}>
            <PencilIcon aria-hidden />
          </Button>
        }
      />
      <DeleteTaskDialog taskId={task.id} taskTitle={task.title} />
    </>
  )
}
