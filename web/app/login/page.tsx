// app/login/page.tsx

'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'

export default function Login() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const supabase = createClient()

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${location.origin}/auth/confirm`,
      },
    })
    if (!error) setSent(true)
  }

  return sent ? (
    <p>Check your email for the login link.</p>
  ) : (
    <div>
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <button type="button" onClick={handleLogin}>Send magic link</button>
    </div>
  )
}