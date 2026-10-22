'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { apiFetch } from '@/lib/api-client'
import { registerSchema, type RegisterData, type RegisterInput } from '@/lib/validation/auth'
import { showServerError } from './form-errors'
import { SubmitButton } from './submit-button'

const FIELDS = ['name', 'email', 'password', 'confirmPassword'] as const

type FieldConfig = {
  name: (typeof FIELDS)[number]
  label: string
  type: 'text' | 'email' | 'password'
  autoComplete: string
  placeholder?: string
}

const FIELD_CONFIG: FieldConfig[] = [
  { name: 'name', label: 'Name', type: 'text', autoComplete: 'name', placeholder: 'Ada Lovelace' },
  { name: 'email', label: 'Email', type: 'email', autoComplete: 'email', placeholder: 'you@example.com' },
  { name: 'password', label: 'Password', type: 'password', autoComplete: 'new-password' },
  { name: 'confirmPassword', label: 'Confirm password', type: 'password', autoComplete: 'new-password' },
]

export function RegisterForm() {
  const router = useRouter()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput, unknown, RegisterData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  })

  async function onSubmit(data: RegisterData) {
    try {
      await apiFetch('/api/auth/register', { method: 'POST', body: data })
      toast.success('Account created')
      router.replace('/tasks')
      router.refresh()
    } catch (err) {
      showServerError(err, FIELDS, setError)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        {FIELD_CONFIG.map(({ name, label, ...input }) => (
          <Field key={name} data-invalid={!!errors[name]}>
            <FieldLabel htmlFor={name}>{label}</FieldLabel>
            <Input
              id={name}
              {...input}
              aria-invalid={!!errors[name]}
              disabled={isSubmitting}
              {...register(name)}
            />
            <FieldError errors={[errors[name]]} />
          </Field>
        ))}
        <SubmitButton pending={isSubmitting}>Create account</SubmitButton>
      </FieldGroup>
    </form>
  )
}
