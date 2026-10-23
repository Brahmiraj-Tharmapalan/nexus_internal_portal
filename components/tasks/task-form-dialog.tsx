'use client'

import { Loader2Icon } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import type { TaskDTO } from '@/server/tasks/task.service'

// The form (react-hook-form, Zod) loads the first time a dialog opens, not with the page.
const TaskForm = dynamic(() => import('./task-form').then((m) => m.TaskForm), {
  loading: () => (
    <div className="grid min-h-80 place-items-center" role="status" aria-label="Loading form">
      <Loader2Icon className="size-5 animate-spin text-muted-foreground" aria-hidden />
    </div>
  ),
})

type Props = {
  /** The task to edit. Omit to create a new task. */
  task?: TaskDTO
  /** The button that opens the dialog. */
  trigger: React.ReactElement
}

/** One dialog for creating and editing a task. */
export function TaskFormDialog({ task, trigger }: Props) {
  const [open, setOpen] = useState(false)
  const isEdit = task !== undefined

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto p-6 sm:max-w-lg">
        <DialogHeader className="gap-1.5 pb-2">
          <DialogTitle className="text-[1.75rem] leading-tight font-normal text-leather">{isEdit ? 'Edit task' : 'New task'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update the details of this task.' : 'Add a task to your list.'}
          </DialogDescription>
        </DialogHeader>
        {/* The popup unmounts when closed, so the form starts fresh every time it opens. */}
        <TaskForm task={task} onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}
