'use client'

import { PlusIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TaskFormDialog } from './task-form-dialog'

export function NewTaskButton({ label = 'New task' }: { label?: string }) {
  return (
    <TaskFormDialog
      trigger={
        <Button>
          <PlusIcon aria-hidden />
          {label}
        </Button>
      }
    />
  )
}
