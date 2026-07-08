// app/components/theme-toggle.test.tsx

import { useTheme } from 'next-themes'
import { useSyncExternalStore } from 'react'
import { ThemeToggle } from './theme-toggle'
import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('next-themes', () => ({
  useTheme: vi.fn(),
}))

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>()
  return {
    ...actual,
    useSyncExternalStore: vi.fn(actual.useSyncExternalStore),
  }
})

const mockUseTheme = vi.mocked(useTheme)
const mockUseSyncExternalStore = vi.mocked(useSyncExternalStore)

describe('ThemeToggle', () => {
  const setTheme = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseTheme.mockReturnValue({
      setTheme,
      theme: 'light',
      resolvedTheme: 'light',
      themes: ['light', 'dark', 'system'],
      systemTheme: 'light',
    } as ReturnType<typeof useTheme>)

    mockUseSyncExternalStore.mockImplementation(
      (_subscribe, getSnapshot) => getSnapshot()
    )
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders an inactive placeholder button before mount (avoids hydration mismatch)', () => {
    mockUseSyncExternalStore.mockImplementation(
      (_subscribe, _getSnapshot, getServerSnapshot) =>
        getServerSnapshot ? getServerSnapshot() : false
    )

    render(<ThemeToggle />)

    const button = screen.getByRole('button', { name: /toggle theme/i })
    expect(button).toBeDisabled()
  })

  it('renders an enabled button with dropdown after mount', async () => {
    render(<ThemeToggle />)

    const trigger = screen.getByRole('button', { name: /toggle theme/i })
    expect(trigger).toBeEnabled()

    const user = userEvent.setup()
    await user.click(trigger)

    expect(await screen.findByText('Light')).toBeInTheDocument()
    expect(screen.getByText('Dark')).toBeInTheDocument()
    expect(screen.getByText('System')).toBeInTheDocument()
  })

  it.each([
    ['Light', 'light'],
    ['Dark', 'dark'],
    ['System', 'system'],
  ])('calls setTheme("%s") -> "%s" when the option is clicked', async (label, value) => {
    render(<ThemeToggle />)

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /toggle theme/i }))
    await user.click(await screen.findByText(label))

    expect(setTheme).toHaveBeenCalledTimes(1)
    expect(setTheme).toHaveBeenCalledWith(value)
  })
})
