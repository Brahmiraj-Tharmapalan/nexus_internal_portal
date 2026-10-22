'use client'

import { useRouter } from 'next/navigation'
import { useOptimistic, useTransition } from 'react'
import { toast } from 'sonner'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ApiRequestError, apiFetch } from '@/lib/api-client'
import type { TaskStatusValue } from '@/lib/validation/task'
import { STATUS_ITEMS, STATUS_LABELS } from './task-meta'

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
    <Select
      items={STATUS_ITEMS}
      value={optimisticStatus}
      onValueChange={changeStatus}
      disabled={isPending}
    >
      <SelectTrigger size="sm" className="w-32" aria-label={`Status of “${taskTitle}”`}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {STATUS_ITEMS.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
