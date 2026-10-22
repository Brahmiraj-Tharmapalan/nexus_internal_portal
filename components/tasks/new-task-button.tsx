'use client'

import { PlusIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { TaskFormDialog } from './task-form-dialog'

type Props = {
  label?: string
  /** `champagne` sits on the green banner; `leather` sits on light paper. */
  tone?: 'leather' | 'champagne'
}

export function NewTaskButton({ label = 'New task', tone = 'leather' }: Props) {
  return (
    <TaskFormDialog
      trigger={
        <Button
          className={cn(
            'h-11 gap-2 px-6 text-[0.95rem] font-semibold',
            tone === 'champagne'
              ? 'bg-champagne text-leather shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_8px_20px_-10px_rgba(0,0,0,0.6)] hover:bg-[#e6cf9f]'
              : 'shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_6px_16px_-8px_rgba(18,58,46,0.6)] hover:bg-primary/90',
          )}
        >
          <PlusIcon className={tone === 'leather' ? 'text-champagne' : undefined} aria-hidden />
          {label}
        </Button>
      }
    />
  )
}
