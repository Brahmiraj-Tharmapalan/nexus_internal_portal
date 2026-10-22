import 'server-only'

import { NextResponse } from 'next/server'
import { z, ZodError } from 'zod'
import { Prisma } from '@/generated/prisma/client'

export type ErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'TOO_MANY_REQUESTS'
  | 'VALIDATION_ERROR'
  | 'INTERNAL_ERROR'

export type ErrorBody = {
  error: { code: ErrorCode; message: string; details?: unknown }
}

/** An expected failure that route handlers can throw; `handleRouteError` turns it into JSON. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: ErrorCode,
    message: string,
    readonly details?: unknown,
    /** Extra response headers, e.g. Retry-After on a 429. */
    readonly headers?: Record<string, string>,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export function ok<T>(data: T, status = 200): NextResponse<T> {
  return NextResponse.json(data, { status })
}

export function error(
  status: number,
  code: ErrorCode,
  message: string,
  details?: unknown,
  headers?: Record<string, string>,
): NextResponse<ErrorBody> {
  const body: ErrorBody = { error: { code, message } }
  if (details !== undefined) body.error.details = details
  return NextResponse.json(body, { status, headers })
}

/** Maps any thrown value to the standard error response. Unknown errors are logged, never leaked. */
export function handleRouteError(err: unknown): NextResponse<ErrorBody> {
  if (err instanceof ApiError) {
    return error(err.status, err.code, err.message, err.details, err.headers)
  }
  if (err instanceof ZodError) {
    return error(422, 'VALIDATION_ERROR', 'Invalid input', z.flattenError(err))
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
    return error(409, 'CONFLICT', 'A record with these details already exists')
  }
  console.error('[api] Unhandled error:', err)
  return error(500, 'INTERNAL_ERROR', 'Something went wrong')
}

/** Reads the JSON body, throwing a 400 ApiError if it is not valid JSON. */
export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json()
  } catch {
    throw new ApiError(400, 'BAD_REQUEST', 'Request body must be valid JSON')
  }
}

/**
 * The client IP for rate limiting. On Vercel the platform sets x-forwarded-for, so its first
 * entry is the real client. Elsewhere, only trust it behind a proxy that overwrites it.
 */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  return forwarded || request.headers.get('x-real-ip')?.trim() || 'unknown'
}

function requestHost(request: Request): string | null {
  // Behind a proxy (e.g. Vercel) the public host is in x-forwarded-host; it may be a list.
  const forwarded = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim()
  return forwarded || request.headers.get('host')
}

/**
 * CSRF guard for mutating routes: throws a 403 ApiError when the Origin header
 * is missing or its host does not match the request host.
 */
export function assertSameOrigin(request: Request): void {
  const origin = request.headers.get('origin')
  const host = requestHost(request)
  let originHost: string | null = null
  if (origin) {
    try {
      originHost = new URL(origin).host
    } catch {
      originHost = null
    }
  }
  if (!originHost || !host || originHost.toLowerCase() !== host.toLowerCase()) {
    throw new ApiError(403, 'FORBIDDEN', 'Cross-origin request rejected')
  }
}
