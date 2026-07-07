import { describe, it, expect, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { middleware } from './middleware'

const getUserMock = vi.fn()

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: { getUser: getUserMock },
  })),
}))

describe('middleware', () => {
  it('calls getUser() to trigger a possible token refresh', async () => {
    getUserMock.mockResolvedValue({ data: { user: null } })
    const req = new NextRequest('http://localhost:3000/')

    await middleware(req)

    expect(getUserMock).toHaveBeenCalled()
  })

  it('returns a NextResponse (does not throw) even without a session', async () => {
    getUserMock.mockResolvedValue({ data: { user: null } })
    const req = new NextRequest('http://localhost:3000/')

    const res = await middleware(req)

    expect(res).toBeDefined()
    expect(res.status).toBe(200)
  })
})