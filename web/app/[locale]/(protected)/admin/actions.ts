// app/[locale]/(protected)/admin/actions.ts

"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser, getUserWithRole } from "@/utils/supabase/auth";

export type EventRecord = {
  id: string;
  name: string;
  event_date: string;
  description: string | null;
  visibility: "published" | "unpublished";
  co_host_id: string | null;
  venue: { id: string; name: string } | null;
};

type EventInput = {
  name: string;
  eventDate: string;
  venueId: string | null;
  description?: string | null;
  visibility?: "published" | "unpublished";
  coHostId?: string | null;
};

export async function getEvents() {
  const { supabase, user } = await getCurrentUser();

  if (!user) {
    return { success: false as const, message: "Not authenticated" };
  }

  const { data, error } = await supabase
    .from("events")
    .select("id, name, event_date, description, visibility, co_host_id, venue:venues(id, name)")
    .order("event_date", { ascending: true });

  if (error) {
    return { success: false as const, message: error.message };
  }

  return { success: true as const, events: data as unknown as EventRecord[] };
}

export type ProfileRecord = {
  id: string;
  full_name: string | null;
};

export async function getProfiles() {
  const { supabase, user } = await getCurrentUser();

  if (!user) {
    return { success: false as const, message: "Not authenticated" };
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name")
    .order("full_name");

  if (error) {
    return { success: false as const, message: error.message };
  }

  return { success: true as const, profiles: data as ProfileRecord[] };
}

export type VenueRecord = {
  id: string;
  name: string;
};

export async function getVenues() {
  const { supabase, user } = await getCurrentUser();

  if (!user) {
    return { success: false as const, message: "Not authenticated" };
  }

  const { data, error } = await supabase.from("venues").select("id, name").order("name");

  if (error) {
    return { success: false as const, message: error.message };
  }

  return { success: true as const, venues: data as VenueRecord[] };
}

type VenueInput = {
  name: string;
  address?: string | null;
  city?: string | null;
  district?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

export async function createVenue(input: VenueInput) {
  const { supabase, user, role } = await getUserWithRole();

  if (!user || role !== "admin") {
    return { success: false as const, message: "Not authorized" };
  }

  const { data, error } = await supabase
    .from("venues")
    .insert({
      name: input.name,
      address: input.address ?? null,
      city: input.city ?? null,
      district: input.district ?? null,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
    })
    .select("id, name")
    .single();

  if (error) {
    return { success: false as const, message: error.message };
  }

  revalidatePath("/admin");
  return { success: true as const, venue: data as VenueRecord };
}

export async function createEvent(input: EventInput) {
  const { supabase, user, role } = await getUserWithRole();

  if (!user || role !== "admin") {
    return { success: false, message: "Not authorized" };
  }

  const { error } = await supabase.from("events").insert({
    name: input.name,
    event_date: input.eventDate,
    venue_id: input.venueId,
    description: input.description ?? null,
    visibility: input.visibility ?? "unpublished",
    co_host_id: input.coHostId ?? null,
    created_by: user.id,
  });

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath("/admin");
  return { success: true, message: "Event created" };
}

export async function updateEvent(id: string, input: Partial<EventInput>) {
  const { supabase, user } = await getCurrentUser();

  if (!user) {
    return { success: false, message: "Not authorized" };
  }

  const { error } = await supabase
    .from("events")
    .update({
      ...(input.name !== undefined && { name: input.name }),
      ...(input.eventDate !== undefined && { event_date: input.eventDate }),
      ...(input.venueId !== undefined && { venue_id: input.venueId }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.visibility !== undefined && { visibility: input.visibility }),
      ...(input.coHostId !== undefined && { co_host_id: input.coHostId }),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath("/admin");
  return { success: true, message: "Event updated" };
}

export async function deleteEvent(id: string) {
  const { supabase, user, role } = await getUserWithRole();

  if (!user || role !== "admin") {
    return { success: false, message: "Not authorized" };
  }

  const { error } = await supabase.from("events").delete().eq("id", id);

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath("/admin");
  return { success: true, message: "Event deleted" };
}
