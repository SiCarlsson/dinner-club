// app/login/page.tsx

'use client'

import { useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { createClient } from '@/utils/supabase/client'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card'

export default function Login() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle')
  const supabase = useMemo(() => createClient(), [])

  const handleLogin = async () => {
    setStatus('loading')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${location.origin}/auth/confirm`,
      },
    })
    setStatus(error ? 'error' : 'sent')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email && status !== 'loading') handleLogin()
  }

  return (
    <main className="flex min-h-dvh items-center justify-center px-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{status === 'sent' ? 'Check your email' : 'Sign in'}</CardTitle>
          <CardDescription>
            {status === 'sent' ? (
              <div>
                We sent a login link to <strong>{email}</strong>.
                <br />
                Click it to sign in.
              </div>
            ) : (
              "Enter your email and we'll send you a login link."
            )}
          </CardDescription>
        </CardHeader>

        {status !== 'sent' && (
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>

              <Button type="submit" disabled={status === 'loading'} className="w-full">
                {status === 'loading' ? 'Sending…' : 'Send login link'}
              </Button>

              {status === 'error' && (
                <p className="text-sm text-destructive">Something went wrong. Try again.</p>
              )}
            </form>
          </CardContent>
        )}
      </Card>
    </main>
  )
}