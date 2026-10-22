'use client'

import { Loader2Icon, LogOutIcon } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useLogout } from './logout-button'

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? (parts.at(-1)?.[0] ?? '') : '')).toUpperCase()
}

/** The avatar in the header. Opens a menu with the user's name, email and Log out. */
export function UserMenu({ name, email }: { name: string; email: string }) {
  const { logout, pending } = useLogout()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Account menu for ${name}`}
        className="grid size-9 place-items-center rounded-full bg-leather text-xs font-semibold tracking-wide text-leather-foreground ring-1 ring-brass/70 ring-offset-2 ring-offset-background transition-shadow outline-none hover:ring-brass focus-visible:ring-2 focus-visible:ring-brass data-popup-open:ring-2 data-popup-open:ring-brass"
      >
        {initials(name)}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={10} className="w-64 rounded-xl p-1.5">
        <div className="flex items-center gap-3 px-2.5 py-2.5">
          <span
            aria-hidden
            className="grid size-10 shrink-0 place-items-center rounded-full bg-leather text-sm font-semibold text-leather-foreground"
          >
            {initials(name)}
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="truncate font-display text-lg leading-tight text-leather">{name}</span>
            <span className="truncate text-xs text-muted-foreground">{email}</span>
          </span>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          className="gap-2.5 px-2.5 py-2 text-sm"
          disabled={pending}
          onClick={logout}
        >
          {pending ? <Loader2Icon className="animate-spin" aria-hidden /> : <LogOutIcon aria-hidden />}
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
