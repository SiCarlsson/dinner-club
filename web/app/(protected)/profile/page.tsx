// app/(protected)/profile/page.tsx

import { NameForm } from './name-form'
import { createClient } from '@/utils/supabase/server'

export default async function Profile() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user!.id)
    .single()

  return (
    <main className="mx-auto min-w-xs py-12 px-6">
      <h1 className="text-xl font-semibold mb-6">Profile</h1>

      <div className="flex flex-col gap-6">
        <div className={`${user !== null && profile?.role === 'admin' ? 'block' : 'hidden'}`}>
          <p className="text-sm font-medium text-zinc-700 mb-1">Role</p>
          <p className="text-sm text-zinc-500">{profile?.role}</p>
        </div>

        <div>
          <p className="text-sm font-medium text-zinc-700 mb-1">Email</p>
          <p className="text-sm text-zinc-500">{user?.email}</p>
        </div>

        <NameForm initialName={profile?.full_name ?? ''} />
      </div>
    </main>
  )
}