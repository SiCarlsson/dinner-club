// app/[locale]/(protected)/events/actions.test.ts

import { describe, it, expect, vi, beforeEach } from "vitest";
import { getCurrentUser } from "@/utils/supabase/auth";

vi.mock("@/utils/supabase/auth", () => ({
  getCurrentUser: vi.fn(),
}));

function mockSupabase() {
  const limit = vi.fn();
  const order = vi.fn().mockReturnValue({ limit });
  const gte = vi.fn().mockReturnValue({ order });
  const eq = vi.fn().mockReturnValue({ gte });
  const select = vi.fn().mockReturnValue({ eq });
  const from = vi.fn().mockReturnValue({ select });

  return { from, select, eq, gte, order, limit };
}

describe("events gallery actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getUpcomingEvents", () => {
    it("returns not authenticated when there is no user", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        supabase: mockSupabase() as never,
        user: null,
      });

      const { getUpcomingEvents } = await import("./actions");
      const result = await getUpcomingEvents();

      expect(result).toEqual({ success: false, message: "Not authenticated" });
    });

    it("returns only published, upcoming events ordered by date ascending", async () => {
      const supabase = mockSupabase();
      const events = [
        {
          id: "1",
          name: "Summer Dinner",
          event_date: "2026-08-01T18:00:00.000Z",
          description: "A warm evening",
          venue: { id: "v1", name: "Café Norr", address: null, district: null },
        },
      ];
      supabase.limit.mockResolvedValue({ data: events, error: null });
      vi.mocked(getCurrentUser).mockResolvedValue({
        supabase: supabase as never,
        user: { id: "user-1" } as never,
      });

      const { getUpcomingEvents } = await import("./actions");
      const result = await getUpcomingEvents();

      expect(supabase.from).toHaveBeenCalledWith("events");
      expect(supabase.eq).toHaveBeenCalledWith("visibility", "published");
      expect(supabase.gte).toHaveBeenCalledWith("event_date", expect.any(String));
      expect(supabase.order).toHaveBeenCalledWith("event_date", { ascending: true });
      expect(supabase.limit).toHaveBeenCalledWith(4);
      expect(result).toEqual({ success: true, events });
    });

    it("returns an error message when the query fails", async () => {
      const supabase = mockSupabase();
      supabase.limit.mockResolvedValue({ data: null, error: { message: "db down" } });
      vi.mocked(getCurrentUser).mockResolvedValue({
        supabase: supabase as never,
        user: { id: "user-1" } as never,
      });

      const { getUpcomingEvents } = await import("./actions");
      const result = await getUpcomingEvents();

      expect(result).toEqual({ success: false, message: "db down" });
    });
  });
});
