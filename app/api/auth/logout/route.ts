import { NextResponse } from 'next/server'
import { getValidSession } from '@/lib/auth/dal'
import { deleteSession } from '@/lib/auth/session'
import { assertSameOrigin, handleRouteError } from '@/lib/http'
import { revokeSessions } from '@/server/auth/auth.service'

export async function POST(request: Request) {
  try {
    assertSameOrigin(request)
    // Bump the version so a copied token stops working too, not just this browser's cookie.
    const session = await getValidSession()
    if (session) await revokeSessions(session.userId)
    await deleteSession()
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    return handleRouteError(err)
  }
}
