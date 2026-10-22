import type { Metadata } from 'next'
import Link from 'next/link'
import { RegisterForm } from '@/components/auth/register-form'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata: Metadata = { title: 'Register · Internal Task Portal' }

export default function RegisterPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Create an account</CardTitle>
        <CardDescription>Register to start managing your tasks.</CardDescription>
      </CardHeader>
      <CardContent>
        <RegisterForm />
      </CardContent>
      <CardFooter className="justify-center border-t py-4 text-sm text-muted-foreground">
        Already have an account?&nbsp;
        <Link href="/login" className="font-medium text-foreground underline underline-offset-4">
          Log in
        </Link>
      </CardFooter>
    </Card>
  )
}
