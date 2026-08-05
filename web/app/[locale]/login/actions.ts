// app/[locale]/login/actions.ts

"use server";

import { createAdminClient } from "@/utils/supabase/admin";

export type InvitationResult =
  { error: true } | { invited: false } | { invited: true; hasAccount: boolean };

export async function checkInvitation(email: string): Promise<InvitationResult> {
  const normalized = email.trim().toLowerCase();

  if (!normalized) {
    return { invited: false };
  }

  const supabase = createAdminClient();

  const { data: invitation, error: invitationError } = await supabase
    .from("invitations")
    .select("id")
    .eq("email", normalized)
    .maybeSingle();

  if (invitationError) {
    return { error: true };
  }

  if (invitation === null) {
    return { invited: false };
  }

  const { data: hasAccount, error: accountError } = await supabase.rpc("email_has_account", {
    p_email: normalized,
  });

  if (accountError) {
    return { error: true };
  }

  return { invited: true, hasAccount: hasAccount === true };
}
