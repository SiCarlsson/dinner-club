// app/(protected)/profile/actions.test.ts

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { updateFullName } from './actions'
import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn(),
}))

describe('updateFullName Server Action', () => {
  const mockGetUser = vi.fn()
  const mockUpdate = vi.fn().mockReturnThis() // Allows method chaining (.update().eq())
  const mockEq = vi.fn()
  const mockFrom = vi.fn().mockReturnValue({
    update: mockUpdate,
    eq: mockEq,
  })

  beforeEach(() => {
    vi.clearAllMocks()

    // Establish the default behavior for the mocked Supabase client
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: mockGetUser },
      from: mockFrom,
    } as unknown as Awaited<ReturnType<typeof createClient>>)
  })

  it('should return an error if the user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })

    const result = await updateFullName('John Doe')

    expect(result).toEqual({ success: false, message: 'Not authenticated' })
    expect(mockFrom).not.toHaveBeenCalled()
    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it('should return the database error message if the update fails', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } } })
    mockEq.mockResolvedValue({ error: { message: 'Database connection timeout' } })

    const result = await updateFullName('John Doe')

    expect(result).toEqual({ success: false, message: 'Database connection timeout' })
    expect(mockFrom).toHaveBeenCalledWith('profiles')
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        full_name: 'John Doe',
        updated_at: expect.any(String), // Asserts that an ISO timestamp string was generated
      })
    )
    expect(mockEq).toHaveBeenCalledWith('id', 'user-123')
    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it('should successfully update the name and call revalidatePath', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } } })
    mockEq.mockResolvedValue({ error: null })

    const result = await updateFullName('John Doe')

    expect(result).toEqual({ success: true, message: 'Name updated' })
    
    expect(revalidatePath).toHaveBeenCalledWith('/profile')
  })
})