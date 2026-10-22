import { NextResponse } from 'next/server'
import { deleteSession } from '@/lib/auth/session'
import { assertSameOrigin, handleRouteError } from '@/lib/http'

export async function POST(request: Request) {
  try {
    assertSameOrigin(request)
    await deleteSession()
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    return handleRouteError(err)
  }
}
