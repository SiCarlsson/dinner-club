// app/auth/logout/route.test.ts

import { POST } from './route'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const signOutMock = vi.fn()

vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn(() =>
    Promise.resolve({ auth: { signOut: signOutMock } })
  ),
}))

describe('/auth/logout route', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls supabase.auth.signOut()', async () => {
    signOutMock.mockResolvedValue({ error: null })
    const req = new Request('http://localhost:3000/auth/logout', { method: 'POST' })

    await POST(req)

    expect(signOutMock).toHaveBeenCalledTimes(1)
  })

  it('redirects to "/" after signing out', async () => {
    signOutMock.mockResolvedValue({ error: null })
    const req = new Request('http://localhost:3000/auth/logout', { method: 'POST' })

    const res = await POST(req)

    expect(res.status).toBe(307) // NextResponse.redirect default status
    expect(res.headers.get('location')).toBe('http://localhost:3000/')
  })
})