import type { Metadata } from 'next'
import Link from 'next/link'
import { LoginForm } from '@/components/auth/login-form'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata: Metadata = { title: 'Log in · Internal Task Portal' }

export default function LoginPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Log in</CardTitle>
        <CardDescription>Enter your email and password to see your tasks.</CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm />
      </CardContent>
      <CardFooter className="justify-center border-t py-4 text-sm text-muted-foreground">
        No account yet?&nbsp;
        <Link href="/register" className="font-medium text-foreground underline underline-offset-4">
          Register
        </Link>
      </CardFooter>
    </Card>
  )
}
