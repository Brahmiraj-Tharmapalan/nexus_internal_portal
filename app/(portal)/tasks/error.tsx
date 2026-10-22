'use client'

import { RotateCwIcon } from 'lucide-react'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function TasksError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-5 rounded-xl border-l-[3px] border-garnet bg-card px-8 py-12 ring-1 ring-border"
    >
      <div className="flex flex-col gap-2">
        <h2 className="font-display text-3xl font-normal text-leather">Your tasks did not load</h2>
        <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
          The server did not respond as expected. Check your connection, then try again.
        </p>
      </div>
      <Button variant="outline" className="h-10 bg-paper px-4" onClick={() => retry()}>
        <RotateCwIcon aria-hidden />
        Try again
      </Button>
    </div>
  )
}
