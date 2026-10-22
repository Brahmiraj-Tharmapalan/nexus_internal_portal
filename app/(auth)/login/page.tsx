import type { Metadata } from 'next'
import { AuthHeading, AuthSwitch } from '@/components/auth/auth-heading'
import { LoginForm } from '@/components/auth/login-form'

export const metadata: Metadata = { title: 'Log in · Nexus' }

export default function LoginPage() {
  return (
    <>
      <AuthHeading title="Welcome back" lead="Log in with your work email to see your tasks." />
      <LoginForm />
      <AuthSwitch prompt="No account yet?" href="/register" label="Create one" />
    </>
  )
}
