import 'server-only'

import { Prisma } from '@/generated/prisma/client'
import { prisma } from '@/lib/db'
import { hashPassword, verifyPassword } from '@/lib/auth/password'
import { publicUserSelect, type PublicUser } from '@/lib/auth/dal'
import { ApiError } from '@/lib/http'
import type { LoginData, RegisterData } from '@/lib/validation/auth'

// A cost-12 bcrypt hash of a random string nobody knows. Comparing against it when the email
// is unknown makes that path take as long as a wrong password, so timing can't reveal accounts.
const DUMMY_HASH = '$2b$12$oxvRmoYsoWQIFlavDjllDOkr327x5L880Kn0f5HpWzD.MuON3Dyf6'

const INVALID_CREDENTIALS = 'Invalid email or password'

export async function registerUser(data: RegisterData): Promise<PublicUser> {
  const passwordHash = await hashPassword(data.password)
  try {
    return await prisma.user.create({
      data: { name: data.name, email: data.email, passwordHash },
      select: publicUserSelect,
    })
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new ApiError(409, 'CONFLICT', 'An account with this email already exists', {
        fieldErrors: { email: ['An account with this email already exists'] },
      })
    }
    throw err
  }
}

/** Returns the user for valid credentials; otherwise throws the same 401 for every failure. */
export async function authenticate(data: LoginData): Promise<PublicUser> {
  const found = await prisma.user.findUnique({
    where: { email: data.email },
    select: { ...publicUserSelect, passwordHash: true },
  })
  if (!found) {
    await verifyPassword(data.password, DUMMY_HASH)
    throw new ApiError(401, 'UNAUTHORIZED', INVALID_CREDENTIALS)
  }
  const { passwordHash, ...user } = found
  if (!(await verifyPassword(data.password, passwordHash))) {
    throw new ApiError(401, 'UNAUTHORIZED', INVALID_CREDENTIALS)
  }
  return user
}
