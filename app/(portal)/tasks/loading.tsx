import { Skeleton } from '@/components/ui/skeleton'

export default function TasksLoading() {
  return (
    <div className="flex flex-col gap-8" aria-busy="true" aria-label="Loading tasks">
      <div className="flex flex-col gap-5 rounded-2xl bg-leather px-7 py-9 sm:px-10 sm:py-11">
        <Skeleton className="h-4 w-36 bg-white/10" />
        <Skeleton className="h-12 w-56 bg-white/10 sm:h-14" />
        <div className="flex gap-2">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-8 w-28 rounded-full bg-white/10" />
          ))}
        </div>
      </div>
      <ul className="divide-y divide-border/80 overflow-hidden rounded-xl bg-card ring-1 ring-border">
        {Array.from({ length: 3 }, (_, i) => (
          <li key={i} className="flex flex-col gap-3 px-5 py-5 sm:px-7">
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <div className="flex gap-3">
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-6 w-28" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
