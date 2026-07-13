// app/[locale]/(protected)/profile/actions.ts

"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/utils/supabase/auth";

export type ProfileUpdate = {
  fullName: string;
  dietaryRestrictions: string[];
};

export async function updateProfile(update: ProfileUpdate) {
  const { supabase, user } = await getCurrentUser();

  if (!user) {
    return { success: false, message: "Not authenticated" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: update.fullName,
      dietary_restrictions: update.dietaryRestrictions,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath("/profile");
  return { success: true, message: "Profile updated" };
}
