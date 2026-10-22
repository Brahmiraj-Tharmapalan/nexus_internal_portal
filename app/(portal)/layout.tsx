import { CheckSquareIcon } from 'lucide-react'
import { LogoutButton } from '@/components/auth/logout-button'
import { getCurrentUser } from '@/lib/auth/dal'

export default async function PortalLayout({ children }: LayoutProps<'/'>) {
  // Redirects to /login when there is no valid session.
  const user = await getCurrentUser()

  return (
    <div className="flex flex-1 flex-col bg-muted/40">
      <header className="border-b bg-background">
        <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between gap-4 px-4">
          <span className="flex items-center gap-2 font-semibold">
            <CheckSquareIcon className="size-5" aria-hidden />
            <span className="hidden sm:inline">Internal Task Portal</span>
            <span className="sm:hidden">Tasks</span>
          </span>
          <div className="flex min-w-0 items-center gap-3">
            {user && (
              <span className="truncate text-sm text-muted-foreground" title={user.email}>
                {user.name}
              </span>
            )}
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:py-8">
        {user ? (
          children
        ) : (
          // The session is valid but its user was deleted. A plain redirect to /login would loop
          // (the cookie still looks valid there), so ask the user to log out, which clears it.
          <p className="rounded-lg border bg-background p-6 text-center text-sm text-muted-foreground">
            Your account no longer exists. Please log out.
          </p>
        )}
      </main>
    </div>
  )
}
