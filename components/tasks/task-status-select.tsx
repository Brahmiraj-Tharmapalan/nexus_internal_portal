'use client'

import { useRouter } from 'next/navigation'
import { useOptimistic, useTransition } from 'react'
import { toast } from 'sonner'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ApiRequestError, apiFetch } from '@/lib/api-client'
import { cn } from '@/lib/utils'
import type { TaskStatusValue } from '@/lib/validation/task'
import { STATUS_DOT_CLASSES, STATUS_ITEMS, STATUS_LABELS } from './task-meta'

type Props = { taskId: string; taskTitle: string; status: TaskStatusValue }

export function TaskStatusSelect({ taskId, taskTitle, status }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  // Shows the new status at once; React reverts it if the request fails.
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(status)

  function changeStatus(next: TaskStatusValue | null) {
    if (!next || next === optimisticStatus) return
    startTransition(async () => {
      setOptimisticStatus(next)
      try {
        await apiFetch(`/api/tasks/${taskId}/status`, { method: 'PATCH', body: { status: next } })
        toast.success(`Marked as ${STATUS_LABELS[next].toLowerCase()}`)
        router.refresh()
      } catch (err) {
        toast.error(err instanceof ApiRequestError ? err.message : 'Could not update status')
      }
    })
  }

  return (
    <Select items={STATUS_ITEMS} value={optimisticStatus} onValueChange={changeStatus} disabled={isPending}>
      <SelectTrigger
        className="w-36 rounded-full bg-paper pl-3 data-[size=default]:h-8"
        aria-label={`Status of “${taskTitle}”`}
      >
        <span aria-hidden className={cn('size-2 shrink-0 rounded-full', STATUS_DOT_CLASSES[optimisticStatus])} />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {STATUS_ITEMS.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            <span aria-hidden className={cn('size-2 shrink-0 rounded-full', STATUS_DOT_CLASSES[item.value])} />
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
