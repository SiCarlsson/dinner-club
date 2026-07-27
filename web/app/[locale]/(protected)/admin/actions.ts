// app/[locale]/(protected)/admin/actions.ts

"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser, getUserWithRole } from "@/utils/supabase/auth";

export type DinnerRecord = {
  id: string;
  name: string;
  dinner_date: string;
  rsvp_deadline: string | null;
  description: string | null;
  visibility: "published" | "unpublished";
  host_id: string | null;
  venue: { id: string; name: string } | null;
};

type DinnerInput = {
  name: string;
  dinnerDate: string;
  venueId: string | null;
  rsvpDeadline?: string | null;
  description?: string | null;
  visibility?: "published" | "unpublished";
  hostId?: string | null;
};

export async function getDinners() {
  const { supabase, user } = await getCurrentUser();

  if (!user) {
    return { success: false as const, message: "Not authenticated" };
  }

  const { data, error } = await supabase
    .from("dinners")
    .select(
      "id, name, dinner_date, rsvp_deadline, description, visibility, host_id, venue:venues(id, name)",
    )
    .order("dinner_date", { ascending: false });

  if (error) {
    return { success: false as const, message: error.message };
  }

  return { success: true as const, dinners: data as unknown as DinnerRecord[] };
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
  address: string | null;
  city: string | null;
  district: string | null;
  latitude: number | null;
  longitude: number | null;
};

const VENUE_COLUMNS = "id, name, address, city, district, latitude, longitude";

export async function getVenues() {
  const { supabase, user } = await getCurrentUser();

  if (!user) {
    return { success: false as const, message: "Not authenticated" };
  }

  const { data, error } = await supabase.from("venues").select(VENUE_COLUMNS).order("name");

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
    .select(VENUE_COLUMNS)
    .single();

  if (error) {
    return { success: false as const, message: error.message };
  }

  revalidatePath("/admin");
  return { success: true as const, venue: data as VenueRecord };
}

export async function updateVenue(id: string, input: VenueInput) {
  const { supabase, user, role } = await getUserWithRole();

  if (!user || role !== "admin") {
    return { success: false as const, message: "Not authorized" };
  }

  const { data, error } = await supabase
    .from("venues")
    .update({
      name: input.name,
      address: input.address ?? null,
      city: input.city ?? null,
      district: input.district ?? null,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select(VENUE_COLUMNS)
    .single();

  if (error) {
    return { success: false as const, message: error.message };
  }

  revalidatePath("/admin");
  return { success: true as const, venue: data as VenueRecord };
}

export async function deleteVenue(id: string) {
  const { supabase, user, role } = await getUserWithRole();

  if (!user || role !== "admin") {
    return { success: false as const, message: "Not authorized" };
  }

  const { error } = await supabase.from("venues").delete().eq("id", id);

  if (error) {
    return { success: false as const, message: error.message };
  }

  revalidatePath("/admin");
  return { success: true as const };
}

export async function createDinner(input: DinnerInput) {
  const { supabase, user, role } = await getUserWithRole();

  if (!user || role !== "admin") {
    return { success: false, message: "Not authorized" };
  }

  const { error } = await supabase.from("dinners").insert({
    name: input.name,
    dinner_date: input.dinnerDate,
    venue_id: input.venueId,
    rsvp_deadline: input.rsvpDeadline ?? null,
    description: input.description ?? null,
    visibility: input.visibility ?? "unpublished",
    host_id: input.hostId ?? null,
    created_by: user.id,
  });

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath("/admin");
  return { success: true, message: "Dinner created" };
}

export async function updateDinner(id: string, input: Partial<DinnerInput>) {
  const { supabase, user } = await getCurrentUser();

  if (!user) {
    return { success: false, message: "Not authorized" };
  }

  const { error } = await supabase
    .from("dinners")
    .update({
      ...(input.name !== undefined && { name: input.name }),
      ...(input.dinnerDate !== undefined && { dinner_date: input.dinnerDate }),
      ...(input.venueId !== undefined && { venue_id: input.venueId }),
      ...(input.rsvpDeadline !== undefined && { rsvp_deadline: input.rsvpDeadline }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.visibility !== undefined && { visibility: input.visibility }),
      ...(input.hostId !== undefined && { host_id: input.hostId }),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath("/admin");
  return { success: true, message: "Dinner updated" };
}

export async function deleteDinner(id: string) {
  const { supabase, user, role } = await getUserWithRole();

  if (!user || role !== "admin") {
    return { success: false, message: "Not authorized" };
  }

  const { error } = await supabase.from("dinners").delete().eq("id", id);

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath("/admin");
  return { success: true, message: "Dinner deleted" };
}

export type InvitationRecord = {
  id: string;
  email: string;
  created_at: string;
};

export async function getInvitations() {
  const { supabase, user, role } = await getUserWithRole();

  if (!user || role !== "admin") {
    return { success: false as const, message: "Not authorized" };
  }

  const { data, error } = await supabase
    .from("invitations")
    .select("id, email, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return { success: false as const, message: error.message };
  }

  return { success: true as const, invitations: data as InvitationRecord[] };
}

export async function addInvitation(email: string) {
  const { supabase, user, role } = await getUserWithRole();

  if (!user || role !== "admin") {
    return { success: false as const, message: "Not authorized" };
  }

  const normalized = email.trim().toLowerCase();

  if (!normalized) {
    return { success: false as const, message: "Email required" };
  }

  const { data, error } = await supabase
    .from("invitations")
    .insert({ email: normalized, invited_by: user.id })
    .select("id, email, created_at")
    .single();

  if (error) {
    return { success: false as const, message: error.message };
  }

  revalidatePath("/admin");
  return { success: true as const, invitation: data as InvitationRecord };
}

export async function removeInvitation(id: string) {
  const { supabase, user, role } = await getUserWithRole();

  if (!user || role !== "admin") {
    return { success: false as const, message: "Not authorized" };
  }

  const { error } = await supabase.from("invitations").delete().eq("id", id);

  if (error) {
    return { success: false as const, message: error.message };
  }

  revalidatePath("/admin");
  return { success: true as const };
}
