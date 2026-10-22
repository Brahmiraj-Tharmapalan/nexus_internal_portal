import { redirect } from 'next/navigation'
import { Wordmark } from '@/components/brand/wordmark'
import { GUILLOCHE } from '@/components/brand/patterns'
import { getSession } from '@/lib/auth/session'

export default async function AuthLayout({ children }: LayoutProps<'/'>) {
  if (await getSession()) redirect('/tasks')

  return (
    <main className="grid flex-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside className="relative hidden overflow-hidden bg-leather text-leather-foreground lg:flex">
        <div aria-hidden className="absolute inset-0 opacity-70" style={GUILLOCHE} />
        <div aria-hidden className="absolute inset-5 rounded-sm border border-brass/35" />
        <div className="relative flex w-full flex-col justify-between p-14">
          <Wordmark tone="light" />
          <div className="max-w-md">
            <p className="font-display text-[3.25rem] leading-[1.05] font-normal tracking-[-0.01em] text-balance">
              Every task, in its proper place.
            </p>
            <div aria-hidden className="mt-8 h-px w-16 bg-brass" />
            <p className="mt-6 max-w-sm text-[0.95rem] leading-relaxed text-leather-foreground/70">
              Plan the work, track where it stands and close it out, all in one quiet ledger.
            </p>
          </div>
          <p className="text-xs text-leather-foreground/50">For internal use by Nexus staff.</p>
        </div>
      </aside>

      <section className="flex flex-col items-center justify-center px-6 py-12 sm:px-12">
        <div className="w-full max-w-[22rem]">
          <Wordmark className="mb-12 lg:hidden" />
          {children}
        </div>
      </section>
    </main>
  )
}
