import Link from 'next/link'

/** Title and lead line at the top of the login and register pages. */
export function AuthHeading({ title, lead }: { title: string; lead: string }) {
  return (
    <header className="mb-9">
      <h1 className="font-display text-[2.4rem] leading-[1.1] font-normal tracking-[-0.01em] text-leather">
        {title}
      </h1>
      <p className="mt-3 text-[0.95rem] leading-relaxed text-muted-foreground">{lead}</p>
    </header>
  )
}

/** The line under the form that links to the other auth page. */
export function AuthSwitch({ prompt, href, label }: { prompt: string; href: string; label: string }) {
  return (
    <p className="mt-10 border-t pt-6 text-sm text-muted-foreground">
      {prompt}{' '}
      <Link
        href={href}
        className="font-medium text-leather underline decoration-brass/60 decoration-1 underline-offset-[5px] transition-colors hover:decoration-brass"
      >
        {label}
      </Link>
    </p>
  )
}
