// utils/supabase/admin.ts
//
// Service-role Supabase client. Bypasses RLS and can call the auth admin API
// (e.g. deleting users). SERVER-ONLY — never import this from client code, and
// never expose SUPABASE_SECRET_KEY to the browser.

import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
