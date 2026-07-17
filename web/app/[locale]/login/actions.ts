// app/[locale]/login/actions.ts

"use server";

import { createAdminClient } from "@/utils/supabase/admin";

// Checks the invitations whitelist before we request a magic link, purely so the
// login page can tell an uninvited person they're not a member. The real
// boundary is the enforce_invitation trigger on auth.users — this can be
// bypassed without any security impact.
//
// Uses the service-role client because the invitations RLS policy only lets
// admins read the table; an anonymous visitor must not be able to enumerate it
// themselves. Returns `{ error: true }` on failure so the caller shows a generic
// error instead of wrongly claiming the visitor isn't a member.
export async function checkInvitation(
  email: string,
): Promise<{ invited: boolean } | { error: true }> {
  const normalized = email.trim().toLowerCase();

  if (!normalized) {
    return { invited: false };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("invitations")
    .select("id")
    .eq("email", normalized)
    .maybeSingle();

  if (error) {
    return { error: true };
  }

  return { invited: data !== null };
}
