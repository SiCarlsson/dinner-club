// app/auth/confirm/route.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from './route'

const exchangeCodeForSessionMock = vi.fn()

vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn(() =>
    Promise.resolve({ auth: { exchangeCodeForSession: exchangeCodeForSessionMock } })
  ),
}))

describe('/auth/confirm route', () => {
  beforeEach(() => vi.clearAllMocks())

  it('redirects to "/" by default when "next" is missing', async () => {
    exchangeCodeForSessionMock.mockResolvedValue({ error: null })
    const req = new NextRequest('http://localhost:3000/auth/confirm?code=valid-code')
    const res = await GET(req)

    expect(res.headers.get('location')).toBe('http://localhost:3000/')
  })

  it('redirects to the given "next" path on a successful exchange', async () => {
    exchangeCodeForSessionMock.mockResolvedValue({ error: null })
    const req = new NextRequest('http://localhost:3000/auth/confirm?code=valid-code&next=/dashboard')
    const res = await GET(req)

    expect(res.headers.get('location')).toContain('/dashboard')
  })

  it('calls exchangeCodeForSession with the code from the query param', async () => {
    exchangeCodeForSessionMock.mockResolvedValue({ error: null })
    const req = new NextRequest('http://localhost:3000/auth/confirm?code=abc-123')
    await GET(req)

    expect(exchangeCodeForSessionMock).toHaveBeenCalledWith('abc-123')
  })

  it('redirects to /login?error=auth when code is missing entirely', async () => {
    const req = new NextRequest('http://localhost:3000/auth/confirm')
    const res = await GET(req)

    expect(res.headers.get('location')).toContain('/login?error=auth')
    expect(exchangeCodeForSessionMock).not.toHaveBeenCalled()
  })

  it('redirects to /login?error=auth when the exchange fails', async () => {
    exchangeCodeForSessionMock.mockResolvedValue({ error: new Error('expired') })
    const req = new NextRequest('http://localhost:3000/auth/confirm?code=expired-code')
    const res = await GET(req)

    expect(res.headers.get('location')).toContain('/login?error=auth')
  })
})