// app/[locale]/(protected)/events/actions.test.ts

import { describe, it, expect, vi, beforeEach } from "vitest";
import { getCurrentUser } from "@/utils/supabase/auth";
import { sendPushToAllSubscribers } from "@/lib/push-server";

vi.mock("@/utils/supabase/auth", () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/push-server", () => ({
  sendPushToAllSubscribers: vi.fn(),
}));

function mockSupabase({
  events,
  eventsError,
  rsvps,
  ratings,
  upsertError,
  deleteError,
  role,
  hosts,
}: {
  events?: unknown[];
  eventsError?: { message: string } | null;
  rsvps?: {
    event_id: string;
    status: string;
    has_plus_one?: boolean;
    plus_one_name?: string | null;
  }[];
  ratings?: {
    event_id: string;
    drinks_rating: number;
    food_rating: number;
    venue_rating: number;
  }[];
  upsertError?: { message: string } | null;
  deleteError?: { message: string } | null;
  role?: "member" | "admin" | null;
  hosts?: { id: string; full_name: string }[];
} = {}) {
  // getUpcomingEvents orders/limits; getPastEvents orders without a limit, so `order`
  // must resolve on its own too. `limit` wraps the same resolved shape.
  const eventsResult = { data: events ?? [], error: eventsError ?? null };
  const limit = vi.fn().mockResolvedValue(eventsResult);
  const order = vi.fn().mockReturnValue({
    limit,
    then: (r: unknown) => Promise.resolve(eventsResult).then(r as never),
  });
  const gte = vi.fn().mockReturnValue({ order });
  const lt = vi.fn().mockReturnValue({ order });
  const eventsEq = vi.fn().mockReturnValue({ gte, lt });
  const eventsSelect = vi.fn().mockReturnValue({ eq: eventsEq });

  const rsvpsIn = vi.fn().mockResolvedValue({ data: rsvps ?? [], error: null });
  const rsvpsEq = vi.fn().mockReturnValue({ in: rsvpsIn });
  const rsvpsSelect = vi.fn().mockReturnValue({ eq: rsvpsEq });

  const ratingsIn = vi.fn().mockResolvedValue({ data: ratings ?? [], error: null });
  const ratingsEq = vi.fn().mockReturnValue({ in: ratingsIn });
  const ratingsSelect = vi.fn().mockReturnValue({ eq: ratingsEq });

  const upsert = vi.fn().mockResolvedValue({ error: upsertError ?? null });

  // removeRsvp chains .delete().eq("event_id", …).eq("user_id", …)
  const deleteEqUser = vi.fn().mockResolvedValue({ error: deleteError ?? null });
  const deleteEqEvent = vi.fn().mockReturnValue({ eq: deleteEqUser });
  const rsvpsDelete = vi.fn().mockReturnValue({ eq: deleteEqEvent });

  // getUpcomingEvents reads the caller's role to decide `canNotify`.
  const profilesSingle = vi.fn().mockResolvedValue({ data: role ? { role } : null, error: null });
  const profilesEq = vi.fn().mockReturnValue({ single: profilesSingle });
  // getUpcomingEvents also looks up host display names by id.
  const profilesIn = vi.fn().mockResolvedValue({ data: hosts ?? [], error: null });
  const profilesSelect = vi.fn().mockReturnValue({ eq: profilesEq, in: profilesIn });

  const from = vi.fn((table) => {
    if (table === "rsvps") return { select: rsvpsSelect, upsert, delete: rsvpsDelete };
    if (table === "ratings") return { select: ratingsSelect, upsert };
    if (table === "profiles") return { select: profilesSelect };
    return { select: eventsSelect };
  });

  return {
    from,
    // events chain handles
    select: eventsSelect,
    eq: eventsEq,
    gte,
    lt,
    order,
    limit,
    // rsvps chain handles
    rsvpsSelect,
    rsvpsEq,
    in: rsvpsIn,
    // ratings chain handles
    ratingsSelect,
    ratingsEq,
    ratingsIn,
    upsert,
    // rsvps delete chain handles
    rsvpsDelete,
    deleteEqEvent,
    deleteEqUser,
    // profiles chain handles
    profilesIn,
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
        events: [
          {
            ...events[0],
            myRsvpStatus: null,
            myHasPlusOne: false,
            myPlusOneName: null,
            myRating: null,
            canNotify: false,
            canManage: false,
            hostName: null,
          },
        ],
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

    it("resolves host display names onto each event", async () => {
      const events = [
        {
          id: "e1",
          name: "First",
          event_date: "2026-08-01T18:00:00.000Z",
          description: null,
          venue: null,
          host_id: "co-1",
        },
        {
          id: "e2",
          name: "Second",
          event_date: "2026-08-08T18:00:00.000Z",
          description: null,
          venue: null,
          host_id: null,
        },
      ];
      const supabase = mockSupabase({
        events,
        hosts: [{ id: "co-1", full_name: "Anna Andersson" }],
      });
      vi.mocked(getCurrentUser).mockResolvedValue({
        supabase: supabase as never,
        user: { id: "user-1" } as never,
      });

      const { getUpcomingEvents } = await import("./actions");
      const result = await getUpcomingEvents();

      expect(supabase.profilesIn).toHaveBeenCalledWith("id", ["co-1"]);
      expect(result.success && result.events.map((e) => e.hostName)).toEqual([
        "Anna Andersson",
        null,
      ]);
    });
  });

  describe("getHostingEvents", () => {
    it("returns not authenticated when there is no user", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        supabase: mockSupabase() as never,
        user: null,
      });

      const { getHostingEvents } = await import("./actions");
      const result = await getHostingEvents();

      expect(result).toEqual({ success: false, message: "Not authenticated" });
    });

    it("returns the upcoming events the caller hosts as manageable", async () => {
      const events = [
        {
          id: "h1",
          name: "My Hosted Dinner",
          event_date: "2026-09-01T18:00:00.000Z",
          description: null,
          venue: null,
        },
      ];
      const supabase = mockSupabase({ events });
      vi.mocked(getCurrentUser).mockResolvedValue({
        supabase: supabase as never,
        user: { id: "user-1" } as never,
      });

      const { getHostingEvents } = await import("./actions");
      const result = await getHostingEvents();

      expect(supabase.from).toHaveBeenCalledWith("events");
      expect(supabase.eq).toHaveBeenCalledWith("host_id", "user-1");
      expect(supabase.gte).toHaveBeenCalledWith("event_date", expect.any(String));
      expect(supabase.order).toHaveBeenCalledWith("event_date", { ascending: true });
      // No visibility filter and no limit — hosts see all of their own dinners.
      expect(supabase.limit).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        events: [
          {
            ...events[0],
            myRsvpStatus: null,
            myHasPlusOne: false,
            myPlusOneName: null,
            myRating: null,
            canNotify: true,
            canManage: true,
            hostName: null,
          },
        ],
      });
    });

    it("merges the caller's RSVP onto the events they host", async () => {
      const events = [
        {
          id: "h1",
          name: "My Hosted Dinner",
          event_date: "2026-09-01T18:00:00.000Z",
          description: null,
          venue: null,
        },
      ];
      const supabase = mockSupabase({
        events,
        rsvps: [{ event_id: "h1", status: "attending", has_plus_one: false, plus_one_name: null }],
      });
      vi.mocked(getCurrentUser).mockResolvedValue({
        supabase: supabase as never,
        user: { id: "user-1" } as never,
      });

      const { getHostingEvents } = await import("./actions");
      const result = await getHostingEvents();

      expect(supabase.in).toHaveBeenCalledWith("event_id", ["h1"]);
      expect(result.success && result.events[0].myRsvpStatus).toBe("attending");
    });

    it("returns an error message when the query fails", async () => {
      const supabase = mockSupabase({ eventsError: { message: "db down" } });
      vi.mocked(getCurrentUser).mockResolvedValue({
        supabase: supabase as never,
        user: { id: "user-1" } as never,
      });

      const { getHostingEvents } = await import("./actions");
      const result = await getHostingEvents();

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

  describe("removeRsvp", () => {
    it("returns not authenticated when there is no user", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        supabase: mockSupabase() as never,
        user: null,
      });

      const { removeRsvp } = await import("./actions");
      const result = await removeRsvp("e1");

      expect(result).toEqual({ success: false, message: "Not authenticated" });
    });

    it("deletes the current user's RSVP for the event", async () => {
      const supabase = mockSupabase();
      vi.mocked(getCurrentUser).mockResolvedValue({
        supabase: supabase as never,
        user: { id: "user-1" } as never,
      });

      const { removeRsvp } = await import("./actions");
      const result = await removeRsvp("e1");

      expect(supabase.from).toHaveBeenCalledWith("rsvps");
      expect(supabase.rsvpsDelete).toHaveBeenCalled();
      expect(supabase.deleteEqEvent).toHaveBeenCalledWith("event_id", "e1");
      expect(supabase.deleteEqUser).toHaveBeenCalledWith("user_id", "user-1");
      expect(result).toEqual({ success: true, message: "RSVP removed" });
    });

    it("returns an error message when the delete fails", async () => {
      const supabase = mockSupabase({ deleteError: { message: "denied" } });
      vi.mocked(getCurrentUser).mockResolvedValue({
        supabase: supabase as never,
        user: { id: "user-1" } as never,
      });

      const { removeRsvp } = await import("./actions");
      const result = await removeRsvp("e1");

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

  describe("getPastEvents", () => {
    it("returns only published, past events ordered by date descending", async () => {
      const events = [
        {
          id: "p1",
          name: "Spring Dinner",
          event_date: "2026-03-01T18:00:00.000Z",
          description: null,
          venue: null,
        },
      ];
      const supabase = mockSupabase({ events });
      vi.mocked(getCurrentUser).mockResolvedValue({
        supabase: supabase as never,
        user: { id: "user-1" } as never,
      });

      const { getPastEvents } = await import("./actions");
      const result = await getPastEvents();

      expect(supabase.eq).toHaveBeenCalledWith("visibility", "published");
      expect(supabase.lt).toHaveBeenCalledWith("event_date", expect.any(String));
      expect(supabase.order).toHaveBeenCalledWith("event_date", { ascending: false });
      expect(result).toEqual({
        success: true,
        events: [
          {
            ...events[0],
            myRsvpStatus: null,
            myHasPlusOne: false,
            myPlusOneName: null,
            myRating: null,
            canNotify: false,
            canManage: false,
            hostName: null,
          },
        ],
      });
    });

    it("merges the user's attendance and existing rating onto each event", async () => {
      const events = [
        {
          id: "p1",
          name: "Spring Dinner",
          event_date: "2026-03-01T18:00:00.000Z",
          description: null,
          venue: null,
        },
      ];
      const supabase = mockSupabase({
        events,
        rsvps: [{ event_id: "p1", status: "attending" }],
        ratings: [{ event_id: "p1", drinks_rating: 4, food_rating: 5, venue_rating: 3 }],
      });
      vi.mocked(getCurrentUser).mockResolvedValue({
        supabase: supabase as never,
        user: { id: "user-1" } as never,
      });

      const { getPastEvents } = await import("./actions");
      const result = await getPastEvents();

      expect(supabase.from).toHaveBeenCalledWith("ratings");
      expect(supabase.ratingsEq).toHaveBeenCalledWith("user_id", "user-1");
      expect(result.success && result.events[0].myRsvpStatus).toBe("attending");
      expect(result.success && result.events[0].myRating).toEqual({
        drinks: 4,
        food: 5,
        venue: 3,
      });
    });
  });

  describe("rateEvent", () => {
    it("returns not authenticated when there is no user", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        supabase: mockSupabase() as never,
        user: null,
      });

      const { rateEvent } = await import("./actions");
      const result = await rateEvent("e1", { drinks: 4, food: 5, venue: 3 });

      expect(result).toEqual({ success: false, message: "Not authenticated" });
    });

    it("upserts the three sub-scores on the (event_id, user_id) conflict target", async () => {
      const supabase = mockSupabase();
      vi.mocked(getCurrentUser).mockResolvedValue({
        supabase: supabase as never,
        user: { id: "user-1" } as never,
      });

      const { rateEvent } = await import("./actions");
      const result = await rateEvent("e1", { drinks: 4, food: 5, venue: 3 });

      expect(supabase.from).toHaveBeenCalledWith("ratings");
      expect(supabase.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          event_id: "e1",
          user_id: "user-1",
          drinks_rating: 4,
          food_rating: 5,
          venue_rating: 3,
        }),
        { onConflict: "event_id,user_id" },
      );
      expect(result).toEqual({ success: true, message: "Rating saved" });
    });

    it("returns an error message when the upsert fails (e.g. RLS rejects a non-attendee)", async () => {
      const supabase = mockSupabase({ upsertError: { message: "denied" } });
      vi.mocked(getCurrentUser).mockResolvedValue({
        supabase: supabase as never,
        user: { id: "user-1" } as never,
      });

      const { rateEvent } = await import("./actions");
      const result = await rateEvent("e1", { drinks: 1, food: 1, venue: 1 });

      expect(result).toEqual({ success: false, message: "denied" });
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

  describe("notifyEventSubscribers", () => {
    function notifySupabase({
      event,
      eventError = null,
      role = null,
    }: {
      event?: { id: string; name: string; event_date: string; host_id: string | null } | null;
      eventError?: { message: string } | null;
      role?: "member" | "admin" | null;
    } = {}) {
      const eventsSingle = vi.fn().mockResolvedValue({ data: event ?? null, error: eventError });
      const eventsEq = vi.fn().mockReturnValue({ single: eventsSingle });
      const eventsSelect = vi.fn().mockReturnValue({ eq: eventsEq });

      const profilesSingle = vi
        .fn()
        .mockResolvedValue({ data: role ? { role } : null, error: null });
      const profilesEq = vi.fn().mockReturnValue({ single: profilesSingle });
      const profilesSelect = vi.fn().mockReturnValue({ eq: profilesEq });

      const from = vi.fn((table: string) =>
        table === "profiles" ? { select: profilesSelect } : { select: eventsSelect },
      );
      return { from, eventsEq };
    }

    const event = {
      id: "e1",
      name: "Autumn Dinner",
      event_date: "2026-09-05T17:00:00.000Z",
      host_id: null,
    };

    it("returns not authenticated when there is no user", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        supabase: notifySupabase() as never,
        user: null,
      });

      const { notifyEventSubscribers } = await import("./actions");
      const result = await notifyEventSubscribers("e1");

      expect(result).toEqual({ success: false, message: "Not authenticated" });
      expect(sendPushToAllSubscribers).not.toHaveBeenCalled();
    });

    it("returns event not found when the event is missing", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        supabase: notifySupabase({ event: null }) as never,
        user: { id: "user-1" } as never,
      });

      const { notifyEventSubscribers } = await import("./actions");
      const result = await notifyEventSubscribers("e1");

      expect(result).toEqual({ success: false, message: "Event not found" });
      expect(sendPushToAllSubscribers).not.toHaveBeenCalled();
    });

    it("rejects a member who is neither admin nor the host", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        supabase: notifySupabase({
          event: { ...event, host_id: "someone-else" },
          role: "member",
        }) as never,
        user: { id: "user-1" } as never,
      });

      const { notifyEventSubscribers } = await import("./actions");
      const result = await notifyEventSubscribers("e1");

      expect(result).toEqual({ success: false, message: "Not authorized" });
      expect(sendPushToAllSubscribers).not.toHaveBeenCalled();
    });

    it("lets an admin send and reports how many devices were reached", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        supabase: notifySupabase({ event, role: "admin" }) as never,
        user: { id: "user-1" } as never,
      });
      vi.mocked(sendPushToAllSubscribers).mockResolvedValue({ success: true, sent: 3, removed: 1 });

      const { notifyEventSubscribers } = await import("./actions");
      const result = await notifyEventSubscribers("e1");

      expect(sendPushToAllSubscribers).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Autumn Dinner", url: "/events", tag: "event-e1" }),
      );
      expect(result).toEqual({ success: true, sent: 3 });
    });

    it("lets the event's host send even without the admin role", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        supabase: notifySupabase({
          event: { ...event, host_id: "user-1" },
          role: "member",
        }) as never,
        user: { id: "user-1" } as never,
      });
      vi.mocked(sendPushToAllSubscribers).mockResolvedValue({ success: true, sent: 1, removed: 0 });

      const { notifyEventSubscribers } = await import("./actions");
      const result = await notifyEventSubscribers("e1");

      expect(sendPushToAllSubscribers).toHaveBeenCalled();
      expect(result).toEqual({ success: true, sent: 1 });
    });

    it("surfaces a send failure", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        supabase: notifySupabase({ event, role: "admin" }) as never,
        user: { id: "user-1" } as never,
      });
      vi.mocked(sendPushToAllSubscribers).mockResolvedValue({
        success: false,
        sent: 0,
        removed: 0,
        message: "push service down",
      });

      const { notifyEventSubscribers } = await import("./actions");
      const result = await notifyEventSubscribers("e1");

      expect(result).toEqual({ success: false, message: "push service down" });
    });
  });
});
