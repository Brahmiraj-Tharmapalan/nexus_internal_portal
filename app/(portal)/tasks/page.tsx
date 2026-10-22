import type { Metadata } from 'next'
import { LogoutButton } from '@/components/auth/logout-button'
import { getCurrentUser } from '@/lib/auth/dal'

export const metadata: Metadata = { title: 'Tasks · Internal Task Portal' }

// Placeholder so login has somewhere to land. Phase 5 replaces this with the task UI.
export default async function TasksPage() {
  const user = await getCurrentUser()

  return (
    <main className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 px-4 py-8">
      <p className="text-sm text-muted-foreground">
        {user ? (
          <>
            Signed in as <span className="font-medium text-foreground">{user.name}</span>
          </>
        ) : (
          'Your account no longer exists. Please log out.'
        )}
      </p>
      <LogoutButton />
    </main>
  )
}
