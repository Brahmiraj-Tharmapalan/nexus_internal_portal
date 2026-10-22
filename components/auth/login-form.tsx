'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { apiFetch } from '@/lib/api-client'
import { loginSchema, type LoginData, type LoginInput } from '@/lib/validation/auth'
import { showServerError } from './form-errors'
import { SubmitButton } from './submit-button'

const FIELDS = ['email', 'password'] as const

export function LoginForm() {
  const router = useRouter()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput, unknown, LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  async function onSubmit(data: LoginData) {
    try {
      await apiFetch('/api/auth/login', { method: 'POST', body: data })
      router.replace('/tasks')
      router.refresh()
    } catch (err) {
      showServerError(err, FIELDS, setError)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        <Field data-invalid={!!errors.email}>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={!!errors.email}
            disabled={isSubmitting}
            {...register('email')}
          />
          <FieldError errors={[errors.email]} />
        </Field>
        <Field data-invalid={!!errors.password}>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            aria-invalid={!!errors.password}
            disabled={isSubmitting}
            {...register('password')}
          />
          <FieldError errors={[errors.password]} />
        </Field>
        <SubmitButton pending={isSubmitting}>Log in</SubmitButton>
      </FieldGroup>
    </form>
  )
}
