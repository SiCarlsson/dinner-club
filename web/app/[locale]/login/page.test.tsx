// app/login/page.test.tsx

import Login from './page'
import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import { render, screen, waitFor } from '@testing-library/react'

const signInWithOtpMock = vi.fn()

vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({
    auth: { signInWithOtp: signInWithOtpMock },
  }),
}))

describe('Login page', () => {
  it('calls signInWithOtp with the correct email and redirect url', async () => {
    signInWithOtpMock.mockResolvedValue({ error: null })
    const user = userEvent.setup()

    render(<Login />)
    await user.type(screen.getByRole('textbox'), 'test@example.com')
    await user.click(screen.getByText(/send login link/i))

    await waitFor(() => {
      expect(signInWithOtpMock).toHaveBeenCalledWith({
        email: 'test@example.com',
        options: { emailRedirectTo: expect.stringContaining('/auth/confirm') },
      })
    })
  })

  it('shows a confirmation message after a successful request', async () => {
    signInWithOtpMock.mockResolvedValue({ error: null })
    const user = userEvent.setup()

    render(<Login />)
    await user.type(screen.getByRole('textbox'), 'test@example.com')
    await user.click(screen.getByText(/send login link/i))

    expect(await screen.findByText(/check your email/i)).toBeInTheDocument()
  })

  it('does NOT show the confirmation message if Supabase returns an error', async () => {
    signInWithOtpMock.mockResolvedValue({ error: new Error('rate limited') })
    const user = userEvent.setup()

    render(<Login />)
    await user.type(screen.getByRole('textbox'), 'test@example.com')
    await user.click(screen.getByText(/send login link/i))

    await waitFor(() => {
      expect(screen.queryByText(/check your email/i)).not.toBeInTheDocument()
    })
  })
})