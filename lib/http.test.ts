import { afterEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { Prisma } from '@/generated/prisma/client'
import {
  ApiError,
  assertSameOrigin,
  clientIp,
  error,
  handleRouteError,
  ok,
  readJson,
} from './http'

describe('429 and clientIp', () => {
  it('handleRouteError passes ApiError headers through (Retry-After)', async () => {
    const res = handleRouteError(
      new ApiError(429, 'TOO_MANY_REQUESTS', 'Slow down', { retryAfter: 30 }, { 'Retry-After': '30' }),
    )
    expect(res.status).toBe(429)
    expect(res.headers.get('Retry-After')).toBe('30')
    await expect(res.json()).resolves.toEqual({
      error: { code: 'TOO_MANY_REQUESTS', message: 'Slow down', details: { retryAfter: 30 } },
    })
  })

  it('clientIp takes the first x-forwarded-for entry, then x-real-ip, else unknown', () => {
    const req = (headers: Record<string, string>) => new Request('http://x.test', { headers })
    expect(clientIp(req({ 'x-forwarded-for': '1.1.1.1, 10.0.0.1' }))).toBe('1.1.1.1')
    expect(clientIp(req({ 'x-real-ip': '2.2.2.2' }))).toBe('2.2.2.2')
    expect(clientIp(req({}))).toBe('unknown')
  })
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ok / error', () => {
  it('ok returns JSON with the given status', async () => {
    const res = ok({ hello: 'world' }, 201)
    expect(res.status).toBe(201)
    await expect(res.json()).resolves.toEqual({ hello: 'world' })
  })

  it('error uses the standard shape and omits details when not given', async () => {
    const res = error(404, 'NOT_FOUND', 'Task not found')
    expect(res.status).toBe(404)
    await expect(res.json()).resolves.toEqual({
      error: { code: 'NOT_FOUND', message: 'Task not found' },
    })
  })
})

describe('handleRouteError', () => {
  it('maps ApiError to its status, code and details', async () => {
    const res = handleRouteError(new ApiError(401, 'UNAUTHORIZED', 'Nope', { hint: 'login' }))
    expect(res.status).toBe(401)
    await expect(res.json()).resolves.toEqual({
      error: { code: 'UNAUTHORIZED', message: 'Nope', details: { hint: 'login' } },
    })
  })

  it('maps ZodError to 422 with flattened details', async () => {
    const parsed = z.object({ title: z.string().min(1, 'Title is required') }).safeParse({ title: '' })
    const res = handleRouteError(parsed.error)
    expect(res.status).toBe(422)
    const body = await res.json()
    expect(body.error.code).toBe('VALIDATION_ERROR')
    expect(body.error.details).toEqual({
      formErrors: [],
      fieldErrors: { title: ['Title is required'] },
    })
  })

  it('maps a Prisma unique violation (P2002) to 409', async () => {
    const err = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: 'test',
    })
    const res = handleRouteError(err)
    expect(res.status).toBe(409)
    expect((await res.json()).error.code).toBe('CONFLICT')
  })

  it('maps unknown errors to a generic 500 and logs them', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    const res = handleRouteError(new Error('db password is hunter2'))
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body).toEqual({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } })
    expect(JSON.stringify(body)).not.toContain('hunter2')
    expect(log).toHaveBeenCalledOnce()
  })
})

describe('readJson', () => {
  it('parses a JSON body', async () => {
    const req = new Request('http://localhost/api', { method: 'POST', body: '{"a":1}' })
    await expect(readJson(req)).resolves.toEqual({ a: 1 })
  })

  it('throws a 400 ApiError for invalid JSON', async () => {
    const req = new Request('http://localhost/api', { method: 'POST', body: '{oops' })
    await expect(readJson(req)).rejects.toMatchObject({ status: 400, code: 'BAD_REQUEST' })
  })
})

describe('assertSameOrigin', () => {
  function request(headers: Record<string, string>) {
    return new Request('http://localhost:3000/api/tasks', { method: 'POST', headers })
  }

  function rejection(req: Request) {
    try {
      assertSameOrigin(req)
      return null
    } catch (err) {
      return err
    }
  }

  it('allows a matching Origin and Host', () => {
    expect(rejection(request({ origin: 'http://localhost:3000', host: 'localhost:3000' }))).toBeNull()
  })

  it('prefers x-forwarded-host when present', () => {
    const req = request({
      origin: 'https://portal.example.com',
      host: 'internal:3000',
      'x-forwarded-host': 'portal.example.com, proxy.local',
    })
    expect(rejection(req)).toBeNull()
  })

  it.each([
    ['missing Origin', { host: 'localhost:3000' }],
    ['different host', { origin: 'https://evil.example', host: 'localhost:3000' }],
    ['different port', { origin: 'http://localhost:4000', host: 'localhost:3000' }],
    ['malformed Origin', { origin: 'null', host: 'localhost:3000' }],
  ])('rejects with 403 for %s', (_label, headers) => {
    const err = rejection(request(headers))
    expect(err).toBeInstanceOf(ApiError)
    expect(err).toMatchObject({ status: 403, code: 'FORBIDDEN' })
  })
})
