import type { ErrorBody } from '@/lib/http'

// Browser-side helpers for calling our own API routes. No 'server-only' here.

export class ApiRequestError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly fieldErrors: Record<string, string[] | undefined> = {},
  ) {
    super(message)
    this.name = 'ApiRequestError'
  }
}

function isErrorBody(value: unknown): value is ErrorBody {
  return (
    typeof value === 'object' &&
    value !== null &&
    'error' in value &&
    typeof (value as ErrorBody).error?.message === 'string'
  )
}

function readFieldErrors(details: unknown): Record<string, string[] | undefined> {
  if (typeof details === 'object' && details !== null && 'fieldErrors' in details) {
    const { fieldErrors } = details as { fieldErrors: unknown }
    if (typeof fieldErrors === 'object' && fieldErrors !== null) {
      return fieldErrors as Record<string, string[] | undefined>
    }
  }
  return {}
}

/** Sends JSON to an API route. Throws ApiRequestError on a non-2xx response or network failure. */
export async function apiFetch<T>(url: string, init: { method: string; body?: unknown }): Promise<T> {
  let response: Response
  try {
    response = await fetch(url, {
      method: init.method,
      headers: init.body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    })
  } catch {
    throw new ApiRequestError(0, 'NETWORK_ERROR', 'Network error. Check your connection.')
  }

  const data: unknown = response.status === 204 ? null : await response.json().catch(() => null)
  if (!response.ok) {
    if (isErrorBody(data)) {
      const { code, message, details } = data.error
      throw new ApiRequestError(response.status, code, message, readFieldErrors(details))
    }
    throw new ApiRequestError(response.status, 'UNKNOWN', 'Something went wrong')
  }
  return data as T
}
