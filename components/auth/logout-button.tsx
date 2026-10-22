'use client'

import { Loader2Icon, LogOutIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { apiFetch } from '@/lib/api-client'

export function LogoutButton() {
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

  return (
    <Button variant="outline" size="sm" onClick={logout} disabled={pending}>
      {pending ? <Loader2Icon className="animate-spin" aria-hidden /> : <LogOutIcon aria-hidden />}
      Log out
    </Button>
  )
}
