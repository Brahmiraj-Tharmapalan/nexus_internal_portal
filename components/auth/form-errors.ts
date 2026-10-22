import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'
import { toast } from 'sonner'
import { ApiRequestError } from '@/lib/api-client'

/** Puts server field errors (422 / 409 details) onto the form and shows a toast. */
export function showServerError<T extends FieldValues>(
  err: unknown,
  fields: readonly Path<T>[],
  setError: UseFormSetError<T>,
): void {
  if (!(err instanceof ApiRequestError)) {
    toast.error('Something went wrong')
    return
  }
  for (const field of fields) {
    const message = err.fieldErrors[field]?.[0]
    if (message) setError(field, { type: 'server', message })
  }
  toast.error(err.message)
}
