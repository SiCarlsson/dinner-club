'use client'

import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/utils/supabase/client'

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
  }

  return user ? (
    <div>
      <p>Logged in as {user.email}</p>
      <button type="button" onClick={handleLogout}>Log out</button>
    </div>
  ) : (
    <div>
      <p>Not logged in</p>
      <button type="button" onClick={() => router.push('/login')}>Log in</button>
    </div>
  )
}