// app/[locale]/(protected)/profile/name-form.tsx

'use client'

import { useState } from 'react'
import { updateFullName } from './actions'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

export function NameForm({ initialName }: { initialName: string }) {
  const [name, setName] = useState(initialName)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('saving')

    const result = await updateFullName(name)

    if (result.success) {
      setStatus('saved')
    } else {
      setStatus('error')
      setMessage(result.message)
    }
  }

  const getButtonText = () => {
    if (status === 'saving') return 'Saving…'
    if (status === 'saved') return 'Saved'
    if (status === 'error') return 'Error'
    if (name !== null) return 'Update name'
    return 'Save name'
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <Label htmlFor="full_name">Name</Label>
      <Input
        id="full_name"
        value={name}
        onChange={(e) => {
          setName(e.target.value)
          setStatus('idle')
        }}
        placeholder="Your name"
      />

      <Button type="submit" disabled={status === 'saving'} className="w-fit">
        {getButtonText()}
      </Button>

      {status === 'error' && <p className="text-sm text-destructive">{message}</p>}
    </form>
  )
}