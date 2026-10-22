import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'

export default async function AuthLayout({ children }: LayoutProps<'/'>) {
  if (await getSession()) redirect('/tasks')

  return (
    <main className="flex flex-1 items-center justify-center bg-muted/40 px-4 py-12">
      <div className="w-full max-w-sm">{children}</div>
    </main>
  )
}
