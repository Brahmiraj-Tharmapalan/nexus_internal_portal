import type { Metadata } from 'next'
import { AuthHeading, AuthSwitch } from '@/components/auth/auth-heading'
import { RegisterForm } from '@/components/auth/register-form'

export const metadata: Metadata = { title: 'Create account · Nexus' }

export default function RegisterPage() {
  return (
    <>
      <AuthHeading title="Create your account" lead="It takes a minute. Your tasks stay private to you." />
      <RegisterForm />
      <AuthSwitch prompt="Already have an account?" href="/login" label="Log in" />
    </>
  )
}
