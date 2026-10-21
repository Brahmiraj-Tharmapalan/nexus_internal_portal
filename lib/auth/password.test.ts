import { describe, expect, it } from 'vitest'
import { hashPassword, verifyPassword } from './password'

describe('password hashing', () => {
  it('hashes with bcrypt cost 12 and verifies the right password', async () => {
    const hash = await hashPassword('Password123!')
    expect(hash).toMatch(/^\$2[aby]\$12\$/)
    expect(hash).not.toContain('Password123!')
    await expect(verifyPassword('Password123!', hash)).resolves.toBe(true)
  })

  it('rejects the wrong password', async () => {
    const hash = await hashPassword('Password123!')
    await expect(verifyPassword('Password124!', hash)).resolves.toBe(false)
  })
})
