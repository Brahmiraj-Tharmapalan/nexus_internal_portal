import { NextResponse, type NextRequest } from 'next/server'
import { SESSION_COOKIE, decrypt } from '@/lib/auth/session'

// UX-only redirects. This is never the security check: pages call verifySession()
// and API routes call requireApiSession().
const GUEST_ONLY = ['/login', '/register']
const PROTECTED_PREFIX = '/tasks'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isProtected = pathname === PROTECTED_PREFIX || pathname.startsWith(`${PROTECTED_PREFIX}/`)
  const isGuestOnly = GUEST_ONLY.includes(pathname)
  if (!isProtected && !isGuestOnly) return NextResponse.next()

  const session = await decrypt(request.cookies.get(SESSION_COOKIE)?.value)

  if (isProtected && !session) {
    return NextResponse.redirect(new URL('/login', request.nextUrl))
  }
  if (isGuestOnly && session) {
    return NextResponse.redirect(new URL('/tasks', request.nextUrl))
  }
  return NextResponse.next()
}

export const config = {
  // Skip API routes, Next internals and any path with a file extension (static assets).
  matcher: ['/((?!api|_next/static|_next/image|.*\\..*).*)'],
}
