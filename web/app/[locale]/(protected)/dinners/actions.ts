// app/[locale]/(protected)/dinners/actions.ts

"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/utils/supabase/auth";
import { sendPushToAllSubscribers } from "@/lib/push-server";
import type { DinnerRecord, ProfileRecord, VenueRecord } from "../admin/actions";

export type RsvpStatus = "attending" | "declined";

export type DinnerRating = { drinks: number; food: number; venue: number };

export type GalleryDinner = {
  id: string;
  name: string;
  dinner_date: string;
  rsvp_deadline: string | null;
  description: string | null;
  venue: { id: string; name: string; address: string | null; district: string | null } | null;
  myRsvpStatus: RsvpStatus | null;
  myHasPlusOne: boolean;
  myPlusOneName: string | null;
  myRating: DinnerRating | null;
  canNotify: boolean;
  canManage: boolean;
  hostName: string | null;
};

export async function getUpcomingDinners() {
  const { supabase, user } = await getCurrentUser();

  if (!user) {
    return { success: false as const, message: "Not authenticated" };
  }

  const { data, error } = await supabase
    .from("dinners")
    .select(
      "id, name, dinner_date, rsvp_deadline, description, host_id, venue:venues(id, name, address, district)",
    )
    .eq("visibility", "published")
    .gte("dinner_date", new Date().toISOString())
    .order("dinner_date", { ascending: true })
    .limit(4); // The gallery shows a hero dinner plus the next three in the grid.

  if (error) {
    return { success: false as const, message: error.message };
  }

  type RawDinner = Omit<
    GalleryDinner,
    "myRsvpStatus" | "myHasPlusOne" | "myPlusOneName" | "myRating" | "canNotify" | "canManage"
  > & { host_id: string | null };
  const dinners = data as unknown as RawDinner[];

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const isAdmin = profile?.role === "admin";

  const { data: rsvps } = await supabase
    .from("rsvps")
    .select("dinner_id, status, has_plus_one, plus_one_name")
    .eq("user_id", user.id)
    .in(
      "dinner_id",
      dinners.map((dinner) => dinner.id),
    );

  const rsvpByDinner = new Map((rsvps ?? []).map((rsvp) => [rsvp.dinner_id, rsvp]));

  const hostIds = [...new Set(dinners.map((dinner) => dinner.host_id).filter(Boolean))];
  const { data: hosts } = hostIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", hostIds)
    : { data: [] };
  const hostNameById = new Map((hosts ?? []).map((host) => [host.id, host.full_name]));

  const dinnersWithRsvp: GalleryDinner[] = dinners.map(({ host_id, ...dinner }) => {
    const rsvp = rsvpByDinner.get(dinner.id);
    const isHost = isAdmin || host_id === user.id;
    return {
      ...dinner,
      myRsvpStatus: (rsvp?.status as RsvpStatus | undefined) ?? null,
      myHasPlusOne: rsvp?.has_plus_one ?? false,
      myPlusOneName: rsvp?.plus_one_name ?? null,
      myRating: null,
      canNotify: isHost,
      canManage: isHost,
      hostName: host_id ? (hostNameById.get(host_id) ?? null) : null,
    };
  });

  return { success: true as const, dinners: dinnersWithRsvp };
}

export async function getPastDinners() {
  const { supabase, user } = await getCurrentUser();

  if (!user) {
    return { success: false as const, message: "Not authenticated" };
  }

  const { data, error } = await supabase
    .from("dinners")
    .select(
      "id, name, dinner_date, rsvp_deadline, description, venue:venues(id, name, address, district)",
    )
    .eq("visibility", "published")
    .lt("dinner_date", new Date().toISOString())
    .order("dinner_date", { ascending: false });

  if (error) {
    return { success: false as const, message: error.message };
  }

  const dinners = data as unknown as Omit<
    GalleryDinner,
    "myRsvpStatus" | "myHasPlusOne" | "myPlusOneName" | "myRating" | "canManage"
  >[];

  const dinnerIds = dinners.map((dinner) => dinner.id);

  const [{ data: rsvps }, { data: ratings }] = await Promise.all([
    supabase
      .from("rsvps")
      .select("dinner_id, status")
      .eq("user_id", user.id)
      .in("dinner_id", dinnerIds),
    supabase
      .from("ratings")
      .select("dinner_id, drinks_rating, food_rating, venue_rating")
      .eq("user_id", user.id)
      .in("dinner_id", dinnerIds),
  ]);

  const statusByDinner = new Map((rsvps ?? []).map((rsvp) => [rsvp.dinner_id, rsvp.status]));
  const ratingByDinner = new Map((ratings ?? []).map((rating) => [rating.dinner_id, rating]));

  const pastDinners: GalleryDinner[] = dinners.map((dinner) => {
    const rating = ratingByDinner.get(dinner.id);
    return {
      ...dinner,
      myRsvpStatus: (statusByDinner.get(dinner.id) as RsvpStatus | undefined) ?? null,
      myHasPlusOne: false,
      myPlusOneName: null,
      myRating: rating
        ? { drinks: rating.drinks_rating, food: rating.food_rating, venue: rating.venue_rating }
        : null,
      canNotify: false, // past dinners aren't announced
      canManage: false, // and aren't edited from the gallery
      hostName: null,
    };
  });

  return { success: true as const, dinners: pastDinners };
}

export async function getHostingDinners() {
  const { supabase, user } = await getCurrentUser();

  if (!user) {
    return { success: false as const, message: "Not authenticated" };
  }

  const { data, error } = await supabase
    .from("dinners")
    .select(
      "id, name, dinner_date, rsvp_deadline, description, venue:venues(id, name, address, district)",
    )
    .eq("host_id", user.id)
    .gte("dinner_date", new Date().toISOString())
    .order("dinner_date", { ascending: true });

  if (error) {
    return { success: false as const, message: error.message };
  }

  const dinners = data as unknown as Omit<
    GalleryDinner,
    "myRsvpStatus" | "myHasPlusOne" | "myPlusOneName" | "myRating" | "canNotify" | "canManage"
  >[];

  const { data: rsvps } = await supabase
    .from("rsvps")
    .select("dinner_id, status, has_plus_one, plus_one_name")
    .eq("user_id", user.id)
    .in(
      "dinner_id",
      dinners.map((dinner) => dinner.id),
    );

  const rsvpByDinner = new Map((rsvps ?? []).map((rsvp) => [rsvp.dinner_id, rsvp]));

  const hostingDinners: GalleryDinner[] = dinners.map((dinner) => {
    const rsvp = rsvpByDinner.get(dinner.id);
    return {
      ...dinner,
      myRsvpStatus: (rsvp?.status as RsvpStatus | undefined) ?? null,
      myHasPlusOne: rsvp?.has_plus_one ?? false,
      myPlusOneName: rsvp?.plus_one_name ?? null,
      myRating: null,
      canNotify: true,
      canManage: true,
      hostName: null,
    };
  });

  return { success: true as const, dinners: hostingDinners };
}

const MANAGE_VENUE_COLUMNS = "id, name, address, city, district, latitude, longitude";

export async function getManageableDinner(dinnerId: string) {
  const { supabase, user } = await getCurrentUser();

  if (!user) {
    return { success: false as const, message: "Not authenticated" };
  }

  const { data: dinner, error } = await supabase
    .from("dinners")
    .select(
      "id, name, dinner_date, rsvp_deadline, description, visibility, host_id, venue:venues(id, name)",
    )
    .eq("id", dinnerId)
    .single();

  if (error || !dinner) {
    return { success: false as const, message: "Dinner not found" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const isAdmin = profile?.role === "admin";
  const isHost = dinner.host_id === user.id;

  if (!isAdmin && !isHost) {
    return { success: false as const, message: "Not authorized" };
  }

  const { data: venues } = await supabase.from("venues").select(MANAGE_VENUE_COLUMNS).order("name");

  let profiles: ProfileRecord[] = [];
  if (dinner.host_id) {
    const { data: host } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("id", dinner.host_id)
      .single();
    if (host) {
      profiles = [host as ProfileRecord];
    }
  }

  return {
    success: true as const,
    dinner: dinner as unknown as DinnerRecord,
    venues: (venues ?? []) as VenueRecord[],
    profiles,
  };
}

export async function rsvpToDinner(dinnerId: string, status: RsvpStatus) {
  const { supabase, user } = await getCurrentUser();

  if (!user) {
    return { success: false as const, message: "Not authenticated" };
  }

  const { error } = await supabase.from("rsvps").upsert(
    {
      dinner_id: dinnerId,
      user_id: user.id,
      status,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "dinner_id,user_id" },
  );

  if (error) {
    return { success: false as const, message: error.message };
  }

  revalidatePath("/dinners");
  return { success: true as const, message: "RSVP saved" };
}

export async function removeRsvp(dinnerId: string) {
  const { supabase, user } = await getCurrentUser();

  if (!user) {
    return { success: false as const, message: "Not authenticated" };
  }

  const { error } = await supabase
    .from("rsvps")
    .delete()
    .eq("dinner_id", dinnerId)
    .eq("user_id", user.id);

  if (error) {
    return { success: false as const, message: error.message };
  }

  revalidatePath("/dinners");
  return { success: true as const, message: "RSVP removed" };
}

export async function setRsvpPlusOne(dinnerId: string, hasPlusOne: boolean, plusOneName: string) {
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
      dinner_id: dinnerId,
      user_id: user.id,
      has_plus_one: hasPlusOne,
      plus_one_name: hasPlusOne ? trimmedName : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "dinner_id,user_id" },
  );

  if (error) {
    return { success: false as const, message: error.message };
  }

  revalidatePath("/dinners");
  return { success: true as const, message: "Plus-one saved" };
}

export async function rateDinner(dinnerId: string, rating: DinnerRating) {
  const { supabase, user } = await getCurrentUser();

  if (!user) {
    return { success: false as const, message: "Not authenticated" };
  }

  const { error } = await supabase.from("ratings").upsert(
    {
      dinner_id: dinnerId,
      user_id: user.id,
      drinks_rating: rating.drinks,
      food_rating: rating.food,
      venue_rating: rating.venue,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "dinner_id,user_id" },
  );

  if (error) {
    return { success: false as const, message: error.message };
  }

  revalidatePath("/dinners");
  return { success: true as const, message: "Rating saved" };
}

export type AttendeeSummary = {
  attendees: { name: string | null; plusOneName: string | null }[];
  memberCount: number;
  guestCount: number;
  totalCount: number;
  dietary: { option: string; count: number }[];
};

export async function getDinnerAttendees(dinnerId: string) {
  const { supabase, user } = await getCurrentUser();

  if (!user) {
    return { success: false as const, message: "Not authenticated" };
  }

  const { data: rsvps, error } = await supabase
    .from("rsvps")
    .select("user_id, has_plus_one, plus_one_name")
    .eq("dinner_id", dinnerId)
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

export async function notifyDinnerSubscribers(dinnerId: string) {
  const { supabase, user } = await getCurrentUser();

  if (!user) {
    return { success: false as const, message: "Not authenticated" };
  }

  // RLS lets members read published dinners; the explicit role/host check
  // below is the real gate on who may send.
  const { data: dinner, error } = await supabase
    .from("dinners")
    .select("id, name, dinner_date, host_id")
    .eq("id", dinnerId)
    .single();

  if (error || !dinner) {
    return { success: false as const, message: "Dinner not found" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const isAdmin = profile?.role === "admin";
  const isHost = dinner.host_id === user.id;

  if (!isAdmin && !isHost) {
    return { success: false as const, message: "Not authorized" };
  }

  const result = await sendPushToAllSubscribers({
    title: dinner.name,
    body: formatNotificationBody(dinner.dinner_date),
    url: "/dinners",
    tag: `dinner-${dinner.id}`,
  });

  if (!result.success) {
    return { success: false as const, message: result.message ?? "Failed to send notification" };
  }

  return { success: true as const, sent: result.sent };
}
