// app/[locale]/(protected)/events/actions.ts

"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/utils/supabase/auth";

export type RsvpStatus = "attending" | "declined" | "maybe";

export type EventRating = { drinks: number; food: number; venue: number };

export type GalleryEvent = {
  id: string;
  name: string;
  event_date: string;
  description: string | null;
  venue: { id: string; name: string; address: string | null; district: string | null } | null;
  myRsvpStatus: RsvpStatus | null;
  myHasPlusOne: boolean;
  myPlusOneName: string | null;
  myRating: EventRating | null;
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

  const events = data as unknown as Omit<
    GalleryEvent,
    "myRsvpStatus" | "myHasPlusOne" | "myPlusOneName" | "myRating"
  >[];

  const { data: rsvps } = await supabase
    .from("rsvps")
    .select("event_id, status, has_plus_one, plus_one_name")
    .eq("user_id", user.id)
    .in(
      "event_id",
      events.map((event) => event.id),
    );

  const rsvpByEvent = new Map((rsvps ?? []).map((rsvp) => [rsvp.event_id, rsvp]));

  const eventsWithRsvp: GalleryEvent[] = events.map((event) => {
    const rsvp = rsvpByEvent.get(event.id);
    return {
      ...event,
      myRsvpStatus: (rsvp?.status as RsvpStatus | undefined) ?? null,
      myHasPlusOne: rsvp?.has_plus_one ?? false,
      myPlusOneName: rsvp?.plus_one_name ?? null,
      myRating: null,
    };
  });

  return { success: true as const, events: eventsWithRsvp };
}

export async function getPastEvents() {
  const { supabase, user } = await getCurrentUser();

  if (!user) {
    return { success: false as const, message: "Not authenticated" };
  }

  const { data, error } = await supabase
    .from("events")
    .select("id, name, event_date, description, venue:venues(id, name, address, district)")
    .eq("visibility", "published")
    .lt("event_date", new Date().toISOString())
    .order("event_date", { ascending: false });

  if (error) {
    return { success: false as const, message: error.message };
  }

  const events = data as unknown as Omit<
    GalleryEvent,
    "myRsvpStatus" | "myHasPlusOne" | "myPlusOneName" | "myRating"
  >[];

  const eventIds = events.map((event) => event.id);

  const [{ data: rsvps }, { data: ratings }] = await Promise.all([
    supabase
      .from("rsvps")
      .select("event_id, status")
      .eq("user_id", user.id)
      .in("event_id", eventIds),
    supabase
      .from("ratings")
      .select("event_id, drinks_rating, food_rating, venue_rating")
      .eq("user_id", user.id)
      .in("event_id", eventIds),
  ]);

  const statusByEvent = new Map((rsvps ?? []).map((rsvp) => [rsvp.event_id, rsvp.status]));
  const ratingByEvent = new Map((ratings ?? []).map((rating) => [rating.event_id, rating]));

  const pastEvents: GalleryEvent[] = events.map((event) => {
    const rating = ratingByEvent.get(event.id);
    return {
      ...event,
      myRsvpStatus: (statusByEvent.get(event.id) as RsvpStatus | undefined) ?? null,
      myHasPlusOne: false,
      myPlusOneName: null,
      myRating: rating
        ? { drinks: rating.drinks_rating, food: rating.food_rating, venue: rating.venue_rating }
        : null,
    };
  });

  return { success: true as const, events: pastEvents };
}

export async function rsvpToEvent(eventId: string, status: RsvpStatus) {
  const { supabase, user } = await getCurrentUser();

  if (!user) {
    return { success: false as const, message: "Not authenticated" };
  }

  const { error } = await supabase.from("rsvps").upsert(
    {
      event_id: eventId,
      user_id: user.id,
      status,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "event_id,user_id" },
  );

  if (error) {
    return { success: false as const, message: error.message };
  }

  revalidatePath("/events");
  return { success: true as const, message: "RSVP saved" };
}

export async function setRsvpPlusOne(eventId: string, hasPlusOne: boolean, plusOneName: string) {
  const { supabase, user } = await getCurrentUser();

  if (!user) {
    return { success: false as const, message: "Not authenticated" };
  }

  const trimmedName = plusOneName.trim();

  if (hasPlusOne && !trimmedName) {
    return { success: false as const, message: "A plus-one name is required" };
  }

  const { error } = await supabase.from("rsvps").upsert(
    {
      event_id: eventId,
      user_id: user.id,
      has_plus_one: hasPlusOne,
      plus_one_name: hasPlusOne ? trimmedName : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "event_id,user_id" },
  );

  if (error) {
    return { success: false as const, message: error.message };
  }

  revalidatePath("/events");
  return { success: true as const, message: "Plus-one saved" };
}

export async function rateEvent(eventId: string, rating: EventRating) {
  const { supabase, user } = await getCurrentUser();

  if (!user) {
    return { success: false as const, message: "Not authenticated" };
  }

  const { error } = await supabase.from("ratings").upsert(
    {
      event_id: eventId,
      user_id: user.id,
      drinks_rating: rating.drinks,
      food_rating: rating.food,
      venue_rating: rating.venue,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "event_id,user_id" },
  );

  if (error) {
    return { success: false as const, message: error.message };
  }

  revalidatePath("/events");
  return { success: true as const, message: "Rating saved" };
}

export type AttendeeSummary = {
  attendees: { name: string | null; plusOneName: string | null }[];
  memberCount: number;
  guestCount: number;
  totalCount: number;
  dietary: { option: string; count: number }[];
};

export async function getEventAttendees(eventId: string) {
  const { supabase, user } = await getCurrentUser();

  if (!user) {
    return { success: false as const, message: "Not authenticated" };
  }

  const { data: rsvps, error } = await supabase
    .from("rsvps")
    .select("user_id, has_plus_one, plus_one_name")
    .eq("event_id", eventId)
    .eq("status", "attending");

  if (error) {
    return { success: false as const, message: error.message };
  }

  const userIds = rsvps.map((rsvp) => rsvp.user_id);

  const { data: profiles, error: profilesError } = userIds.length
    ? await supabase
        .from("profiles")
        .select("id, full_name, dietary_restrictions")
        .in("id", userIds)
    : { data: [], error: null };

  if (profilesError) {
    return { success: false as const, message: profilesError.message };
  }

  const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));

  const attendees = rsvps
    .map((rsvp) => ({
      name: profileById.get(rsvp.user_id)?.full_name ?? null,
      plusOneName: rsvp.has_plus_one ? rsvp.plus_one_name : null,
    }))
    .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));

  const dietaryCounts = new Map<string, number>();
  for (const rsvp of rsvps) {
    for (const slug of profileById.get(rsvp.user_id)?.dietary_restrictions ?? []) {
      dietaryCounts.set(slug, (dietaryCounts.get(slug) ?? 0) + 1);
    }
  }
  const dietary = [...dietaryCounts.entries()]
    .map(([option, count]) => ({ option, count }))
    .sort((a, b) => b.count - a.count || a.option.localeCompare(b.option));

  const guestCount = rsvps.filter((rsvp) => rsvp.has_plus_one).length;

  return {
    success: true as const,
    summary: {
      attendees,
      memberCount: rsvps.length,
      guestCount,
      totalCount: rsvps.length + guestCount,
      dietary,
    } satisfies AttendeeSummary,
  };
}
