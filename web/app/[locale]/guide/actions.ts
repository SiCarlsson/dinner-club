// app/[locale]/guide/actions.ts

"use server";

import { createClient } from "@/utils/supabase/server";

export type VenueRating = {
  venue_id: string;
  venue_name: string;
  avg_overall: number;
  avg_drinks: number;
  avg_food: number;
  avg_venue: number;
  rating_count: number;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  district: string | null;
  city: string | null;
};

export async function getVenueRatings() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .rpc("venue_rating_averages")
    .select(
      "venue_id, venue_name, avg_overall, avg_drinks, avg_food, avg_venue, rating_count, latitude, longitude, address, district, city",
    )
    // Highest overall first; more ratings wins ties as the more confident score.
    .order("avg_overall", { ascending: false })
    .order("rating_count", { ascending: false });

  if (error) {
    return { success: false as const, message: error.message };
  }

  return { success: true as const, venues: data as VenueRating[] };
}
