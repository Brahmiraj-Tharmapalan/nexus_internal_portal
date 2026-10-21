import { describe, expect, it } from 'vitest'
import { loginSchema, registerSchema } from './auth'

const validRegister = {
  name: '  Ada Lovelace  ',
  email: '  Ada@Example.COM ',
  password: 'Password123',
  confirmPassword: 'Password123',
}

function fieldErrors(result: { success: boolean; error?: { issues: { path: PropertyKey[] }[] } }) {
  return (result.error?.issues ?? []).map((issue) => issue.path.join('.'))
}

describe('registerSchema', () => {
  it('trims the name and trims + lowercases the email', () => {
    const data = registerSchema.parse(validRegister)
    expect(data.name).toBe('Ada Lovelace')
    expect(data.email).toBe('ada@example.com')
  })

  it('rejects an empty name and a name over 80 characters', () => {
    expect(fieldErrors(registerSchema.safeParse({ ...validRegister, name: '   ' }))).toContain('name')
    expect(
      fieldErrors(registerSchema.safeParse({ ...validRegister, name: 'a'.repeat(81) })),
    ).toContain('name')
  })

  it('rejects an invalid email', () => {
    expect(
      fieldErrors(registerSchema.safeParse({ ...validRegister, email: 'not-an-email' })),
    ).toContain('email')
  })

  it.each([
    ['too short', 'abc123'],
    ['no number', 'Password'],
    ['no letter', '12345678'],
  ])('rejects a password that is %s', (_label, password) => {
    const result = registerSchema.safeParse({ ...validRegister, password, confirmPassword: password })
    expect(fieldErrors(result)).toContain('password')
  })

  it('reports mismatched passwords on confirmPassword', () => {
    const result = registerSchema.safeParse({ ...validRegister, confirmPassword: 'Password124' })
    expect(result.success).toBe(false)
    expect(fieldErrors(result)).toEqual(['confirmPassword'])
  })
})

describe('loginSchema', () => {
  it('lowercases the email', () => {
    const data = loginSchema.parse({ email: 'Demo@Portal.dev', password: 'x' })
    expect(data.email).toBe('demo@portal.dev')
  })

  it('requires a password', () => {
    const result = loginSchema.safeParse({ email: 'demo@portal.dev', password: '' })
    expect(fieldErrors(result)).toContain('password')
  })
})
