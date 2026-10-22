'use client'

import { Loader2Icon, LogOutIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { apiFetch } from '@/lib/api-client'

/** Ends the session and sends the user to /login. */
export function useLogout() {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  async function logout() {
    setPending(true)
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' })
      router.replace('/login')
      router.refresh()
    } catch {
      toast.error('Could not log out. Please try again.')
      setPending(false)
    }
  }

  return { logout, pending }
}

export function LogoutButton() {
  const { logout, pending } = useLogout()

  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-muted-foreground hover:text-foreground"
      onClick={logout}
      disabled={pending}
    >
      {pending ? <Loader2Icon className="animate-spin" aria-hidden /> : <LogOutIcon aria-hidden />}
      Log out
    </Button>
  )
}
