import { NewTaskButton } from './new-task-button'

// Faint ruled lines, like a blank ledger page.
const RULED = {
  backgroundImage:
    'repeating-linear-gradient(to bottom, transparent 0 35px, color-mix(in srgb, var(--brass) 18%, transparent) 35px 36px)',
}

export function TaskEmptyState() {
  return (
    <div className="relative overflow-hidden rounded-xl bg-card ring-1 ring-border">
      <div aria-hidden className="absolute inset-0" style={RULED} />
      <div aria-hidden className="absolute inset-y-0 left-12 w-px bg-garnet/20" />
      <div className="relative flex flex-col items-start gap-5 px-8 py-16 sm:pl-20">
        <div className="flex flex-col gap-2">
          <h2 className="font-display text-3xl font-normal text-leather">A blank page</h2>
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
            Nothing is on your list yet. Add a task to start tracking your work.
          </p>
        </div>
        <NewTaskButton label="Add your first task" />
      </div>
    </div>
  )
}
