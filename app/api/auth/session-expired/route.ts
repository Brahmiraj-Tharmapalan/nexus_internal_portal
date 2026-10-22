import { NextResponse } from 'next/server'
import { getValidSession } from '@/lib/auth/dal'
import { deleteSession } from '@/lib/auth/session'

/**
 * Pages redirect here when the session cookie fails the database check (revoked or the user
 * was deleted). It clears the cookie and sends the user to /login. A valid session is left
 * alone, so a cross-site link to this URL can't log anyone out.
 */
export async function GET(request: Request) {
  const session = await getValidSession()
  if (session) {
    return NextResponse.redirect(new URL('/tasks', request.url))
  }
  await deleteSession()
  return NextResponse.redirect(new URL('/login', request.url))
}
