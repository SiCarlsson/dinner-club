// app/[locale]/(protected)/profile/actions.ts

"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/utils/supabase/auth";

export async function updateFullName(fullName: string) {
  const { supabase, user } = await getCurrentUser();

  if (!user) {
    return { success: false, message: "Not authenticated" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath("/profile");
  return { success: true, message: "Name updated" };
}
