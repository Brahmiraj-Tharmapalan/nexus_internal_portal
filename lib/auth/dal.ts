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

/** Where pages send a session that fails the database check; it clears the cookie. */
export const SESSION_EXPIRED_PATH = '/api/auth/session-expired'

/**
 * The session from the cookie, checked against the database: the user must still exist and
 * the token's sessionVersion must match (logout bumps it). The role comes from the database,
 * so a role change applies at once. Returns null when any check fails.
 */
export async function getValidSession(): Promise<SessionPayload | null> {
  const session = await getSession()
  if (!session) return null
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { role: true, sessionVersion: true },
  })
  if (!user || user.sessionVersion !== session.sv) return null
  return { userId: session.userId, role: user.role, sv: user.sessionVersion }
}

/** For pages and Server Components: redirects away when there is no valid session. */
export const verifySession = cache(async (): Promise<SessionPayload> => {
  const session = await getValidSession()
  // A revoked or orphaned token can't be cleared during render, and /login would bounce a
  // cookie that still looks valid back here, so let a route handler clear it first.
  if (!session) redirect(SESSION_EXPIRED_PATH)
  return session
})

export function getUserById(userId: string): Promise<PublicUser | null> {
  return prisma.user.findUnique({ where: { id: userId }, select: publicUserSelect })
}

/**
 * For pages: the logged-in user, or null if it vanished between the session check and this read.
 * Redirects away when there is no valid session.
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
  const session = await getValidSession()
  if (!session) {
    throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required')
  }
  return session
}
