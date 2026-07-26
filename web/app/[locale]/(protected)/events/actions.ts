// app/[locale]/(protected)/events/actions.ts

"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/utils/supabase/auth";
import { sendPushToAllSubscribers } from "@/lib/push-server";
import type { EventRecord, ProfileRecord, VenueRecord } from "../admin/actions";

export type RsvpStatus = "attending" | "declined";

export type EventRating = { drinks: number; food: number; venue: number };

export type GalleryEvent = {
  id: string;
  name: string;
  event_date: string;
  rsvp_deadline: string | null;
  description: string | null;
  venue: { id: string; name: string; address: string | null; district: string | null } | null;
  myRsvpStatus: RsvpStatus | null;
  myHasPlusOne: boolean;
  myPlusOneName: string | null;
  myRating: EventRating | null;
  canNotify: boolean;
  // Admin or this event's co-host — may edit the dinner and notify members.
  canManage: boolean;
  // Display name of the event's co-host, if one is set.
  coHostName: string | null;
};

export async function getUpcomingEvents() {
  const { supabase, user } = await getCurrentUser();

  if (!user) {
    return { success: false as const, message: "Not authenticated" };
  }

  const { data, error } = await supabase
    .from("events")
    .select(
      "id, name, event_date, rsvp_deadline, description, co_host_id, venue:venues(id, name, address, district)",
    )
    .eq("visibility", "published")
    .gte("event_date", new Date().toISOString())
    .order("event_date", { ascending: true })
    .limit(4); // The gallery shows a hero dinner plus the next three in the grid.

  if (error) {
    return { success: false as const, message: error.message };
  }

  type RawEvent = Omit<
    GalleryEvent,
    "myRsvpStatus" | "myHasPlusOne" | "myPlusOneName" | "myRating" | "canNotify" | "canManage"
  > & { co_host_id: string | null };
  const events = data as unknown as RawEvent[];

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const isAdmin = profile?.role === "admin";

  const { data: rsvps } = await supabase
    .from("rsvps")
    .select("event_id, status, has_plus_one, plus_one_name")
    .eq("user_id", user.id)
    .in(
      "event_id",
      events.map((event) => event.id),
    );

  const rsvpByEvent = new Map((rsvps ?? []).map((rsvp) => [rsvp.event_id, rsvp]));

  const coHostIds = [...new Set(events.map((event) => event.co_host_id).filter(Boolean))];
  const { data: coHosts } = coHostIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", coHostIds)
    : { data: [] };
  const coHostNameById = new Map((coHosts ?? []).map((coHost) => [coHost.id, coHost.full_name]));

  const eventsWithRsvp: GalleryEvent[] = events.map(({ co_host_id, ...event }) => {
    const rsvp = rsvpByEvent.get(event.id);
    const isHost = isAdmin || co_host_id === user.id;
    return {
      ...event,
      myRsvpStatus: (rsvp?.status as RsvpStatus | undefined) ?? null,
      myHasPlusOne: rsvp?.has_plus_one ?? false,
      myPlusOneName: rsvp?.plus_one_name ?? null,
      myRating: null,
      canNotify: isHost,
      canManage: isHost,
      coHostName: co_host_id ? (coHostNameById.get(co_host_id) ?? null) : null,
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
    .select(
      "id, name, event_date, rsvp_deadline, description, venue:venues(id, name, address, district)",
    )
    .eq("visibility", "published")
    .lt("event_date", new Date().toISOString())
    .order("event_date", { ascending: false });

  if (error) {
    return { success: false as const, message: error.message };
  }

  const events = data as unknown as Omit<
    GalleryEvent,
    "myRsvpStatus" | "myHasPlusOne" | "myPlusOneName" | "myRating" | "canManage"
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
      canNotify: false, // past events aren't announced
      canManage: false, // and aren't edited from the gallery
      coHostName: null,
    };
  });

  return { success: true as const, events: pastEvents };
}

export async function getHostingEvents() {
  const { supabase, user } = await getCurrentUser();

  if (!user) {
    return { success: false as const, message: "Not authenticated" };
  }

  const { data, error } = await supabase
    .from("events")
    .select(
      "id, name, event_date, rsvp_deadline, description, venue:venues(id, name, address, district)",
    )
    .eq("co_host_id", user.id)
    .gte("event_date", new Date().toISOString())
    .order("event_date", { ascending: true });

  if (error) {
    return { success: false as const, message: error.message };
  }

  const events = data as unknown as Omit<
    GalleryEvent,
    "myRsvpStatus" | "myHasPlusOne" | "myPlusOneName" | "myRating" | "canNotify" | "canManage"
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

  const hostingEvents: GalleryEvent[] = events.map((event) => {
    const rsvp = rsvpByEvent.get(event.id);
    return {
      ...event,
      myRsvpStatus: (rsvp?.status as RsvpStatus | undefined) ?? null,
      myHasPlusOne: rsvp?.has_plus_one ?? false,
      myPlusOneName: rsvp?.plus_one_name ?? null,
      myRating: null,
      canNotify: true,
      canManage: true,
      coHostName: null,
    };
  });

  return { success: true as const, events: hostingEvents };
}

const MANAGE_VENUE_COLUMNS = "id, name, address, city, district, latitude, longitude";

export async function getManageableEvent(eventId: string) {
  const { supabase, user } = await getCurrentUser();

  if (!user) {
    return { success: false as const, message: "Not authenticated" };
  }

  const { data: event, error } = await supabase
    .from("events")
    .select(
      "id, name, event_date, rsvp_deadline, description, visibility, co_host_id, venue:venues(id, name)",
    )
    .eq("id", eventId)
    .single();

  if (error || !event) {
    return { success: false as const, message: "Event not found" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const isAdmin = profile?.role === "admin";
  const isCoHost = event.co_host_id === user.id;

  if (!isAdmin && !isCoHost) {
    return { success: false as const, message: "Not authorized" };
  }

  const { data: venues } = await supabase.from("venues").select(MANAGE_VENUE_COLUMNS).order("name");

  let profiles: ProfileRecord[] = [];
  if (event.co_host_id) {
    const { data: coHost } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("id", event.co_host_id)
      .single();
    if (coHost) {
      profiles = [coHost as ProfileRecord];
    }
  }

  return {
    success: true as const,
    event: event as unknown as EventRecord,
    venues: (venues ?? []) as VenueRecord[],
    profiles,
  };
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

export async function removeRsvp(eventId: string) {
  const { supabase, user } = await getCurrentUser();

  if (!user) {
    return { success: false as const, message: "Not authenticated" };
  }

  const { error } = await supabase
    .from("rsvps")
    .delete()
    .eq("event_id", eventId)
    .eq("user_id", user.id);

  if (error) {
    return { success: false as const, message: error.message };
  }

  revalidatePath("/events");
  return { success: true as const, message: "RSVP removed" };
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

// "5 sep · 19:00" — used as the push body (app default locale)
function formatNotificationBody(dateString: string) {
  const date = new Date(dateString);
  const day = new Intl.DateTimeFormat("sv-SE", { day: "numeric", month: "short" })
    .format(date)
    .replace(/\./g, "");
  const time = new Intl.DateTimeFormat("sv-SE", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
  return `${day} · ${time}`;
}

export async function notifyEventSubscribers(eventId: string) {
  const { supabase, user } = await getCurrentUser();

  if (!user) {
    return { success: false as const, message: "Not authenticated" };
  }

  // RLS lets members read published events; the explicit role/co-host check
  // below is the real gate on who may send.
  const { data: event, error } = await supabase
    .from("events")
    .select("id, name, event_date, co_host_id")
    .eq("id", eventId)
    .single();

  if (error || !event) {
    return { success: false as const, message: "Event not found" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const isAdmin = profile?.role === "admin";
  const isCoHost = event.co_host_id === user.id;

  if (!isAdmin && !isCoHost) {
    return { success: false as const, message: "Not authorized" };
  }

  const result = await sendPushToAllSubscribers({
    title: event.name,
    body: formatNotificationBody(event.event_date),
    url: "/events",
    tag: `event-${event.id}`,
  });

  if (!result.success) {
    return { success: false as const, message: result.message ?? "Failed to send notification" };
  }

  return { success: true as const, sent: result.sent };
}
