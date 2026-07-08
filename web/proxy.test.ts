// app/proxy.test.ts

import { describe, it, expect, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { proxy } from './proxy'

const getUserMock = vi.fn()
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: { getUser: getUserMock },
  })),
}))

vi.mock('next-intl/middleware', () => ({
  default: vi.fn(() => (req: NextRequest) => {
    const hasLocale = /^\/(sv|en)(\/|$)/.test(req.nextUrl.pathname)
    if (!hasLocale) {
      const url = new URL(`/sv${req.nextUrl.pathname}`, req.url)
      return NextResponse.redirect(url)
    }
    const res = NextResponse.next()
    const locale = req.nextUrl.pathname.split('/')[1]
    res.cookies.set('NEXT_LOCALE', locale)
    return res
  }),
}))

describe('proxy', () => {
  describe('supabase auth', () => {
    it('calls getUser() to trigger a possible token refresh', async () => {
      getUserMock.mockResolvedValue({ data: { user: null } })
      const req = new NextRequest('http://localhost:3000/sv')
      await proxy(req)
      expect(getUserMock).toHaveBeenCalled()
    })

    it('returns a NextResponse (does not throw) even without a session', async () => {
      getUserMock.mockResolvedValue({ data: { user: null } })
      const req = new NextRequest('http://localhost:3000/sv')
      const res = await proxy(req)
      expect(res).toBeDefined()
      expect(res.status).toBe(200)
    })
  })

  describe('i18n routing', () => {
    it('redirects to the default locale when no locale prefix is present', async () => {
      getUserMock.mockResolvedValue({ data: { user: null } })
      const req = new NextRequest('http://localhost:3000/')
      const res = await proxy(req)

      expect(res.status).toBe(307)
      expect(res.headers.get('location')).toContain('/sv')
    })

    it('passes through when a valid locale prefix is present', async () => {
      getUserMock.mockResolvedValue({ data: { user: null } })
      const req = new NextRequest('http://localhost:3000/en/some-page')
      const res = await proxy(req)

      expect(res.status).toBe(200)
    })
  })

  describe('protected paths with locale prefix', () => {
    it('redirects to /login when accessing a protected path without a session', async () => {
      getUserMock.mockResolvedValue({ data: { user: null } })
      const req = new NextRequest('http://localhost:3000/en/profile')
      const res = await proxy(req)

      expect(res.status).toBe(307)
      expect(res.headers.get('location')).toContain('/login')
    })

    it('allows access to a protected path when a session exists', async () => {
      getUserMock.mockResolvedValue({ data: { user: { id: 'user-123' } } })
      const req = new NextRequest('http://localhost:3000/sv/profile')
      const res = await proxy(req)

      expect(res.status).toBe(200)
    })
  })
})