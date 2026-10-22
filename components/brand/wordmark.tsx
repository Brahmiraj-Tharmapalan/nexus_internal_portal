import { cn } from '@/lib/utils'

type Props = { className?: string; tone?: 'ink' | 'light' }

/** Monogram seal plus the Nexus name, set in the display serif. */
export function Wordmark({ className, tone = 'ink' }: Props) {
  return (
    <span className={cn('inline-flex items-center gap-3', className)}>
      <span
        aria-hidden
        className={cn(
          'grid size-9 place-items-center rounded-full border font-display text-lg leading-none italic',
          tone === 'light' ? 'border-champagne/70 text-champagne' : 'border-brass bg-paper text-leather',
        )}
      >
        N
      </span>
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            'font-display text-[1.5rem] tracking-[0.01em]',
            tone === 'light' ? 'text-leather-foreground' : 'text-leather',
          )}
        >
          Nexus
        </span>
        <span
          className={cn(
            'mt-1 text-xs font-medium tracking-[0.02em]',
            tone === 'light' ? 'text-leather-foreground/60' : 'text-muted-foreground',
          )}
        >
          Task portal
        </span>
      </span>
    </span>
  )
}
