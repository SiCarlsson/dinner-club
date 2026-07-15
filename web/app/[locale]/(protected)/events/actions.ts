// app/[locale]/(protected)/events/actions.ts

"use server";

import { getCurrentUser } from "@/utils/supabase/auth";

export type GalleryEvent = {
  id: string;
  name: string;
  event_date: string;
  description: string | null;
  venue: { id: string; name: string; address: string | null; district: string | null } | null;
};

export async function getUpcomingEvents() {
  const { supabase, user } = await getCurrentUser();

  if (!user) {
    return { success: false as const, message: "Not authenticated" };
  }

  const { data, error } = await supabase
    .from("events")
    .select("id, name, event_date, description, venue:venues(id, name, address, district)")
    .eq("visibility", "published")
    .gte("event_date", new Date().toISOString())
    .order("event_date", { ascending: true })
    .limit(4); // The gallery shows a hero dinner plus the next three in the grid.

  if (error) {
    return { success: false as const, message: error.message };
  }

  return { success: true as const, events: data as unknown as GalleryEvent[] };
}
