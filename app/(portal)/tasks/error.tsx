'use client'

import { AlertTriangleIcon, RotateCwIcon } from 'lucide-react'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function TasksError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-xl border bg-background px-6 py-12 text-center"
    >
      <AlertTriangleIcon className="size-8 text-destructive" aria-hidden />
      <div className="flex flex-col gap-1">
        <h2 className="font-medium">Could not load your tasks</h2>
        <p className="text-sm text-muted-foreground">Something went wrong. Please try again.</p>
      </div>
      <Button variant="outline" onClick={() => retry()}>
        <RotateCwIcon aria-hidden />
        Try again
      </Button>
    </div>
  )
}
