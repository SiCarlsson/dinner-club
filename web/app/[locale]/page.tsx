// app/[locale]/page.tsx

'use client'

import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/utils/supabase/client'
import { ThemeToggle } from '@/components/theme-toggle'
import { useTranslations } from 'next-intl'

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.refresh()
  }

  const handleLogin = () => {
    router.push('/login')
  }

  const a = useTranslations("Auth")
  const t = useTranslations("HomePage")

  return (
    <>
      {user ? (
        <div>
          <p>{t("Authenticated")} {user.email}</p>
          <button type="button" onClick={handleLogout}>{a("Logout")}</button>
        </div>
      ) : (
        <div>
          <p>{t("Unauthenticated")}</p>
          <button type="button" onClick={handleLogin}>{a("Login")}</button>
        </div>
      )}
      <ThemeToggle />
    </>
  )
}