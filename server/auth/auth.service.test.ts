import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Prisma } from '@/generated/prisma/client'
import { ApiError } from '@/lib/http'

const { create, findUnique, updateMany } = vi.hoisted(() => ({
  create: vi.fn(),
  findUnique: vi.fn(),
  updateMany: vi.fn(),
}))
vi.mock('@/lib/db', () => ({ prisma: { user: { create, findUnique, updateMany } } }))

const { verifyPassword } = vi.hoisted(() => ({ verifyPassword: vi.fn() }))
vi.mock('@/lib/auth/password', () => ({
  hashPassword: vi.fn(async (p: string) => `hashed:${p}`),
  verifyPassword,
}))

const { authenticate, registerUser, revokeSessions } = await import('./auth.service')

const publicUser = {
  id: 'user_1',
  name: 'Ada',
  email: 'ada@example.com',
  role: 'USER' as const,
  createdAt: new Date('2026-01-01'),
  sessionVersion: 0,
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('registerUser', () => {
  const input = {
    name: 'Ada',
    email: 'ada@example.com',
    password: 'Password123',
    confirmPassword: 'Password123',
  }

  it('stores a hash, never the password, and selects only public fields', async () => {
    create.mockResolvedValue(publicUser)
    await expect(registerUser(input)).resolves.toEqual(publicUser)

    const args = create.mock.calls[0][0]
    expect(args.data).toEqual({ name: 'Ada', email: 'ada@example.com', passwordHash: 'hashed:Password123' })
    expect(args.select.passwordHash).toBeUndefined()
    expect(args.select.sessionVersion).toBe(true)
  })

  it('turns a duplicate email into a 409 with an email field error', async () => {
    create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: 'test',
      }),
    )
    const err = await registerUser(input).catch((e: unknown) => e)
    expect(err).toBeInstanceOf(ApiError)
    expect(err).toMatchObject({ status: 409, code: 'CONFLICT' })
    expect((err as ApiError).details).toMatchObject({ fieldErrors: { email: [expect.any(String)] } })
  })

  it('rethrows other errors', async () => {
    create.mockRejectedValue(new Error('db down'))
    await expect(registerUser(input)).rejects.toThrow('db down')
  })
})

describe('authenticate', () => {
  const creds = { email: 'ada@example.com', password: 'Password123' }

  it('returns the user and sessionVersion without passwordHash for valid credentials', async () => {
    findUnique.mockResolvedValue({ ...publicUser, passwordHash: 'stored-hash' })
    verifyPassword.mockResolvedValue(true)

    const user = await authenticate(creds)
    expect(user).toEqual(publicUser)
    expect(user).not.toHaveProperty('passwordHash')
    expect(verifyPassword).toHaveBeenCalledWith('Password123', 'stored-hash')
  })

  it('gives the same 401 for a wrong password', async () => {
    findUnique.mockResolvedValue({ ...publicUser, passwordHash: 'stored-hash' })
    verifyPassword.mockResolvedValue(false)
    await expect(authenticate(creds)).rejects.toMatchObject({
      status: 401,
      message: 'Invalid email or password',
    })
  })

  it('gives the same 401 for an unknown email and still runs a bcrypt compare', async () => {
    findUnique.mockResolvedValue(null)
    verifyPassword.mockResolvedValue(false)
    await expect(authenticate(creds)).rejects.toMatchObject({
      status: 401,
      message: 'Invalid email or password',
    })
    expect(verifyPassword).toHaveBeenCalledWith('Password123', expect.stringMatching(/^\$2[aby]\$12\$/))
  })
})

describe('revokeSessions', () => {
  it('bumps the user sessionVersion so older tokens stop working', async () => {
    updateMany.mockResolvedValue({ count: 1 })
    await revokeSessions('user_1')
    expect(updateMany).toHaveBeenCalledWith({
      where: { id: 'user_1' },
      data: { sessionVersion: { increment: 1 } },
    })
  })
})
