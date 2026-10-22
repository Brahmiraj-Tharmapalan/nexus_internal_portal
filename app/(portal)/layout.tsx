import { LogoutButton } from '@/components/auth/logout-button'
import { UserMenu } from '@/components/auth/user-menu'
import { Wordmark } from '@/components/brand/wordmark'
import { getCurrentUser } from '@/lib/auth/dal'

export default async function PortalLayout({ children }: LayoutProps<'/'>) {
  // Redirects to /login when there is no valid session.
  const user = await getCurrentUser()

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-border/80 bg-background/85 backdrop-blur supports-[backdrop-filter]:sticky supports-[backdrop-filter]:top-0 supports-[backdrop-filter]:z-30">
        <div className="mx-auto flex h-[4.5rem] w-full max-w-3xl items-center justify-between gap-4 px-4 sm:px-6">
          <Wordmark />
          {user ? <UserMenu name={user.name} email={user.email} /> : <LogoutButton />}
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-10 pb-16 sm:px-6 sm:pt-14">
        {user ? (
          children
        ) : (
          // The session is valid but its user was deleted. A plain redirect to /login would loop
          // (the cookie still looks valid there), so ask the user to log out, which clears it.
          <p className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
            This account no longer exists. Log out to continue.
          </p>
        )}
      </main>
    </div>
  )
}
