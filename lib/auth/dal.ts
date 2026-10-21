import 'server-only'

import { cache } from 'react'
import { redirect } from 'next/navigation'
import type { Prisma } from '@/generated/prisma/client'
import { prisma } from '@/lib/db'
import { ApiError } from '@/lib/http'
import { getSession, type SessionPayload } from '@/lib/auth/session'

/** User fields that are safe to send to the client. Never includes passwordHash. */
export const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
} satisfies Prisma.UserSelect

export type PublicUser = Prisma.UserGetPayload<{ select: typeof publicUserSelect }>

/** For pages and Server Components: redirects to /login when there is no valid session. */
export const verifySession = cache(async (): Promise<SessionPayload> => {
  const session = await getSession()
  if (!session) redirect('/login')
  return session
})

export function getUserById(userId: string): Promise<PublicUser | null> {
  return prisma.user.findUnique({ where: { id: userId }, select: publicUserSelect })
}

/**
 * For pages: the logged-in user, or null if the session points at a user that no longer exists.
 * Redirects to /login when there is no valid session.
 */
export const getCurrentUser = cache(async (): Promise<PublicUser | null> => {
  const { userId } = await verifySession()
  return getUserById(userId)
})

/**
 * For API routes: returns the session or throws a 401 ApiError.
 * Call it inside the handler's try block so `handleRouteError` turns it into JSON.
 */
export async function requireApiSession(): Promise<SessionPayload> {
  const session = await getSession()
  if (!session) {
    throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required')
  }
  return session
}
