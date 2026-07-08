// app/profile/page.tsx

import { createClient } from '@/utils/supabase/server'

export default async function Profile() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <main>
      <h1>Profile</h1>
      <p>Logged in as {user?.email}</p>
    </main>
  )
}