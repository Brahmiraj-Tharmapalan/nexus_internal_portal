import 'server-only'

import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { Role } from '@/generated/prisma/enums'

const secret = process.env.SESSION_SECRET
if (!secret) {
  throw new Error('SESSION_SECRET is not set')
}
if (secret.length < 32) {
  throw new Error('SESSION_SECRET must be at least 32 characters')
}
const key = new TextEncoder().encode(secret)

export const SESSION_COOKIE = 'session'
export const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60

export type SessionPayload = {
  userId: string
  role: Role
  /** The user's sessionVersion when the token was issued. A mismatch means it was revoked. */
  sv: number
}

function isRole(value: unknown): value is Role {
  return Object.values(Role).includes(value as Role)
}

function isSessionVersion(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0
}

export async function encrypt(payload: SessionPayload): Promise<string> {
  // Copy only the allowed fields so nothing else can leak into the token.
  return new SignJWT({ userId: payload.userId, role: payload.role, sv: payload.sv })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(key)
}

/**
 * Returns the session payload, or null for a missing, invalid, tampered or expired token.
 * This only checks the signature; `lib/auth/dal.ts` also checks the user and sessionVersion.
 */
export async function decrypt(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ['HS256'] })
    if (
      typeof payload.userId !== 'string' ||
      !payload.userId ||
      !isRole(payload.role) ||
      !isSessionVersion(payload.sv)
    ) {
      return null
    }
    return { userId: payload.userId, role: payload.role, sv: payload.sv }
  } catch {
    return null
  }
}

export async function createSession(payload: SessionPayload): Promise<void> {
  const token = await encrypt(payload)
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  })
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  return decrypt(cookieStore.get(SESSION_COOKIE)?.value)
}
