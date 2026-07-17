// app/[locale]/guide/actions.test.ts

import { describe, it, expect, beforeEach, vi } from "vitest";
import { createClient } from "@/utils/supabase/server";
import { getVenueRatings } from "./actions";

vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn(),
}));

function mockSupabase({
  data = [],
  error = null,
}: {
  data?: unknown[];
  error?: { message: string } | null;
} = {}) {
  const result = { data, error };
  const order = vi.fn();
  order.mockReturnValue({
    order,
    then: (resolve: (value: typeof result) => unknown) => Promise.resolve(result).then(resolve),
  });
  const select = vi.fn().mockReturnValue({ order });
  const rpc = vi.fn().mockReturnValue({ select });
  return { rpc, select, order };
}

describe("getVenueRatings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reads the aggregated ratings ordered by overall score then rating count", async () => {
    const venues = [
      {
        venue_id: "v1",
        venue_name: "Rolfs Kök",
        avg_overall: 4.3,
        avg_drinks: 4.5,
        avg_food: 4.2,
        avg_venue: 4.1,
        rating_count: 3,
        district: "Norrmalm",
        city: "Stockholm",
      },
    ];
    const supabase = mockSupabase({ data: venues });
    vi.mocked(createClient).mockResolvedValue(
      supabase as unknown as Awaited<ReturnType<typeof createClient>>,
    );

    const result = await getVenueRatings();

    expect(supabase.rpc).toHaveBeenCalledWith("venue_rating_averages");
    expect(supabase.select).toHaveBeenCalledWith(expect.stringContaining("city"));
    expect(supabase.order).toHaveBeenNthCalledWith(1, "avg_overall", { ascending: false });
    expect(supabase.order).toHaveBeenNthCalledWith(2, "rating_count", { ascending: false });
    expect(result).toEqual({ success: true, venues });
  });

  it("returns an error message when the query fails", async () => {
    const supabase = mockSupabase({ error: { message: "permission denied" } });
    vi.mocked(createClient).mockResolvedValue(
      supabase as unknown as Awaited<ReturnType<typeof createClient>>,
    );

    const result = await getVenueRatings();

    expect(result).toEqual({ success: false, message: "permission denied" });
  });
});
