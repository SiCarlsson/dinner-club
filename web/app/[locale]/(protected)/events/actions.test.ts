// app/[locale]/(protected)/events/actions.test.ts

import { describe, it, expect, vi, beforeEach } from "vitest";
import { getCurrentUser } from "@/utils/supabase/auth";

vi.mock("@/utils/supabase/auth", () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

function mockSupabase({
  events,
  eventsError,
  rsvps,
  upsertError,
}: {
  events?: unknown[];
  eventsError?: { message: string } | null;
  rsvps?: {
    event_id: string;
    status: string;
    has_plus_one?: boolean;
    plus_one_name?: string | null;
  }[];
  upsertError?: { message: string } | null;
} = {}) {
  const limit = vi.fn().mockResolvedValue({ data: events ?? [], error: eventsError ?? null });
  const order = vi.fn().mockReturnValue({ limit });
  const gte = vi.fn().mockReturnValue({ order });
  const eventsEq = vi.fn().mockReturnValue({ gte });
  const eventsSelect = vi.fn().mockReturnValue({ eq: eventsEq });

  const inFn = vi.fn().mockResolvedValue({ data: rsvps ?? [], error: null });
  const rsvpsEq = vi.fn().mockReturnValue({ in: inFn });
  const rsvpsSelect = vi.fn().mockReturnValue({ eq: rsvpsEq });
  const upsert = vi.fn().mockResolvedValue({ error: upsertError ?? null });

  const from = vi.fn((table) =>
    table === "rsvps" ? { select: rsvpsSelect, upsert } : { select: eventsSelect },
  );

  return {
    from,
    // events chain handles
    select: eventsSelect,
    eq: eventsEq,
    gte,
    order,
    limit,
    // rsvps chain handles
    rsvpsSelect,
    rsvpsEq,
    in: inFn,
    upsert,
  };
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
      const events = [
        {
          id: "1",
          name: "Summer Dinner",
          event_date: "2026-08-01T18:00:00.000Z",
          description: "A warm evening",
          venue: { id: "v1", name: "Café Norr", address: null, district: null },
        },
      ];
      const supabase = mockSupabase({ events });
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
      expect(result).toEqual({
        success: true,
        events: [{ ...events[0], myRsvpStatus: null, myHasPlusOne: false, myPlusOneName: null }],
      });
    });

    it("merges the current user's RSVP status onto each event", async () => {
      const events = [
        {
          id: "e1",
          name: "First",
          event_date: "2026-08-01T18:00:00.000Z",
          description: null,
          venue: null,
        },
        {
          id: "e2",
          name: "Second",
          event_date: "2026-08-08T18:00:00.000Z",
          description: null,
          venue: null,
        },
      ];
      const supabase = mockSupabase({
        events,
        rsvps: [{ event_id: "e1", status: "attending", has_plus_one: true, plus_one_name: "Alex" }],
      });
      vi.mocked(getCurrentUser).mockResolvedValue({
        supabase: supabase as never,
        user: { id: "user-1" } as never,
      });

      const { getUpcomingEvents } = await import("./actions");
      const result = await getUpcomingEvents();

      expect(supabase.from).toHaveBeenCalledWith("rsvps");
      expect(supabase.rsvpsEq).toHaveBeenCalledWith("user_id", "user-1");
      expect(supabase.in).toHaveBeenCalledWith("event_id", ["e1", "e2"]);
      expect(
        result.success &&
          result.events.map((e) => [e.myRsvpStatus, e.myHasPlusOne, e.myPlusOneName]),
      ).toEqual([
        ["attending", true, "Alex"],
        [null, false, null],
      ]);
    });

    it("returns an error message when the query fails", async () => {
      const supabase = mockSupabase({ eventsError: { message: "db down" } });
      vi.mocked(getCurrentUser).mockResolvedValue({
        supabase: supabase as never,
        user: { id: "user-1" } as never,
      });

      const { getUpcomingEvents } = await import("./actions");
      const result = await getUpcomingEvents();

      expect(result).toEqual({ success: false, message: "db down" });
    });
  });

  describe("rsvpToEvent", () => {
    it("returns not authenticated when there is no user", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        supabase: mockSupabase() as never,
        user: null,
      });

      const { rsvpToEvent } = await import("./actions");
      const result = await rsvpToEvent("e1", "attending");

      expect(result).toEqual({ success: false, message: "Not authenticated" });
    });

    it("upserts the RSVP on the (event_id, user_id) conflict target", async () => {
      const supabase = mockSupabase();
      vi.mocked(getCurrentUser).mockResolvedValue({
        supabase: supabase as never,
        user: { id: "user-1" } as never,
      });

      const { rsvpToEvent } = await import("./actions");
      const result = await rsvpToEvent("e1", "declined");

      expect(supabase.from).toHaveBeenCalledWith("rsvps");
      expect(supabase.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ event_id: "e1", user_id: "user-1", status: "declined" }),
        { onConflict: "event_id,user_id" },
      );
      expect(result).toEqual({ success: true, message: "RSVP saved" });
    });

    it("returns an error message when the upsert fails", async () => {
      const supabase = mockSupabase({ upsertError: { message: "denied" } });
      vi.mocked(getCurrentUser).mockResolvedValue({
        supabase: supabase as never,
        user: { id: "user-1" } as never,
      });

      const { rsvpToEvent } = await import("./actions");
      const result = await rsvpToEvent("e1", "attending");

      expect(result).toEqual({ success: false, message: "denied" });
    });
  });

  describe("setRsvpPlusOne", () => {
    it("returns not authenticated when there is no user", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        supabase: mockSupabase() as never,
        user: null,
      });

      const { setRsvpPlusOne } = await import("./actions");
      const result = await setRsvpPlusOne("e1", true, "Alex");

      expect(result).toEqual({ success: false, message: "Not authenticated" });
    });

    it("upserts a trimmed plus-one name when bringing a plus-one", async () => {
      const supabase = mockSupabase();
      vi.mocked(getCurrentUser).mockResolvedValue({
        supabase: supabase as never,
        user: { id: "user-1" } as never,
      });

      const { setRsvpPlusOne } = await import("./actions");
      const result = await setRsvpPlusOne("e1", true, "  Alex  ");

      expect(supabase.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          event_id: "e1",
          user_id: "user-1",
          has_plus_one: true,
          plus_one_name: "Alex",
        }),
        { onConflict: "event_id,user_id" },
      );
      expect(result).toEqual({ success: true, message: "Plus-one saved" });
    });

    it("rejects a plus-one without a name and does not write", async () => {
      const supabase = mockSupabase();
      vi.mocked(getCurrentUser).mockResolvedValue({
        supabase: supabase as never,
        user: { id: "user-1" } as never,
      });

      const { setRsvpPlusOne } = await import("./actions");
      const result = await setRsvpPlusOne("e1", true, "   ");

      expect(supabase.upsert).not.toHaveBeenCalled();
      expect(result).toEqual({ success: false, message: "A plus-one name is required" });
    });

    it("clears the name when not bringing a plus-one, respecting the DB constraint", async () => {
      const supabase = mockSupabase();
      vi.mocked(getCurrentUser).mockResolvedValue({
        supabase: supabase as never,
        user: { id: "user-1" } as never,
      });

      const { setRsvpPlusOne } = await import("./actions");
      await setRsvpPlusOne("e1", false, "Alex");

      expect(supabase.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ has_plus_one: false, plus_one_name: null }),
        { onConflict: "event_id,user_id" },
      );
    });
  });

  describe("getEventAttendees", () => {
    function attendeeSupabase({
      rsvps = [],
      rsvpsError = null,
      profiles = [],
    }: {
      rsvps?: {
        user_id: string;
        has_plus_one: boolean;
        plus_one_name: string | null;
      }[];
      rsvpsError?: { message: string } | null;
      profiles?: { id: string; full_name: string | null; dietary_restrictions: string[] }[];
    } = {}) {
      const eqStatus = vi.fn().mockResolvedValue({ data: rsvps, error: rsvpsError });
      const eqEvent = vi.fn().mockReturnValue({ eq: eqStatus });
      const rsvpsSelect = vi.fn().mockReturnValue({ eq: eqEvent });

      const profilesIn = vi.fn().mockResolvedValue({ data: profiles, error: null });
      const profilesSelect = vi.fn().mockReturnValue({ in: profilesIn });

      const from = vi.fn((table: string) =>
        table === "profiles" ? { select: profilesSelect } : { select: rsvpsSelect },
      );

      return { from, rsvpsSelect, eqEvent, eqStatus, profilesIn };
    }

    it("returns not authenticated when there is no user", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        supabase: attendeeSupabase() as never,
        user: null,
      });

      const { getEventAttendees } = await import("./actions");
      const result = await getEventAttendees("e1");

      expect(result).toEqual({ success: false, message: "Not authenticated" });
    });

    it("aggregates attendees, guests, and dietary restrictions", async () => {
      const supabase = attendeeSupabase({
        rsvps: [
          { user_id: "u1", has_plus_one: true, plus_one_name: "Alex" },
          { user_id: "u2", has_plus_one: false, plus_one_name: null },
        ],
        profiles: [
          { id: "u1", full_name: "Zara", dietary_restrictions: ["vegan", "gluten"] },
          { id: "u2", full_name: "Adam", dietary_restrictions: ["vegan"] },
        ],
      });
      vi.mocked(getCurrentUser).mockResolvedValue({
        supabase: supabase as never,
        user: { id: "u1" } as never,
      });

      const { getEventAttendees } = await import("./actions");
      const result = await getEventAttendees("e1");

      expect(supabase.eqEvent).toHaveBeenCalledWith("event_id", "e1");
      expect(supabase.eqStatus).toHaveBeenCalledWith("status", "attending");
      expect(supabase.profilesIn).toHaveBeenCalledWith("id", ["u1", "u2"]);
      expect(result.success && result.summary).toEqual({
        // Sorted by name: Adam before Zara.
        attendees: [
          { name: "Adam", plusOneName: null },
          { name: "Zara", plusOneName: "Alex" },
        ],
        memberCount: 2,
        guestCount: 1,
        totalCount: 3,
        // vegan (2) ranks above gluten (1).
        dietary: [
          { option: "vegan", count: 2 },
          { option: "gluten", count: 1 },
        ],
      });
    });

    it("skips the profiles query when nobody is attending", async () => {
      const supabase = attendeeSupabase({ rsvps: [] });
      vi.mocked(getCurrentUser).mockResolvedValue({
        supabase: supabase as never,
        user: { id: "u1" } as never,
      });

      const { getEventAttendees } = await import("./actions");
      const result = await getEventAttendees("e1");

      expect(supabase.profilesIn).not.toHaveBeenCalled();
      expect(result.success && result.summary.totalCount).toBe(0);
    });

    it("returns an error message when the rsvps query fails", async () => {
      const supabase = attendeeSupabase({ rsvpsError: { message: "db down" } });
      vi.mocked(getCurrentUser).mockResolvedValue({
        supabase: supabase as never,
        user: { id: "u1" } as never,
      });

      const { getEventAttendees } = await import("./actions");
      const result = await getEventAttendees("e1");

      expect(result).toEqual({ success: false, message: "db down" });
    });
  });
});
