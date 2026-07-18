// app/[locale]/(protected)/admin/actions.test.ts

import { describe, it, expect, vi, beforeEach } from "vitest";
import { getCurrentUser, getUserWithRole } from "@/utils/supabase/auth";

vi.mock("@/utils/supabase/auth", () => ({
  getCurrentUser: vi.fn(),
  getUserWithRole: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

function mockSupabase() {
  const single = vi.fn();
  const order = vi.fn().mockReturnValue({ single });
  const eq = vi.fn().mockReturnValue({ single });
  const select = vi.fn().mockReturnValue({ order, eq, single });
  const insert = vi.fn().mockReturnValue({ select });
  const deleteBuilder = vi.fn().mockReturnValue({ eq });
  const update = vi.fn().mockReturnValue({ eq });
  const from = vi.fn().mockReturnValue({ select, insert, delete: deleteBuilder, update });

  return { from, select, order, eq, single, insert, delete: deleteBuilder, update };
}

describe("admin actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getEvents", () => {
    it("returns not authenticated when there is no user", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        supabase: mockSupabase() as never,
        user: null,
      });

      const { getEvents } = await import("./actions");
      const result = await getEvents();

      expect(result).toEqual({ success: false, message: "Not authenticated" });
    });

    it("returns events for an authenticated user", async () => {
      const supabase = mockSupabase();
      supabase.order.mockResolvedValue({
        data: [{ id: "1", name: "Dinner", event_date: "2026-08-01", venue: null }],
        error: null,
      });
      vi.mocked(getCurrentUser).mockResolvedValue({
        supabase: supabase as never,
        user: { id: "user-1" } as never,
      });

      const { getEvents } = await import("./actions");
      const result = await getEvents();

      expect(supabase.from).toHaveBeenCalledWith("events");
      expect(result).toEqual({
        success: true,
        events: [{ id: "1", name: "Dinner", event_date: "2026-08-01", venue: null }],
      });
    });

    it("returns an error message when the query fails", async () => {
      const supabase = mockSupabase();
      supabase.order.mockResolvedValue({ data: null, error: { message: "db down" } });
      vi.mocked(getCurrentUser).mockResolvedValue({
        supabase: supabase as never,
        user: { id: "user-1" } as never,
      });

      const { getEvents } = await import("./actions");
      const result = await getEvents();

      expect(result).toEqual({ success: false, message: "db down" });
    });
  });

  describe("getVenues", () => {
    it("returns not authenticated when there is no user", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        supabase: mockSupabase() as never,
        user: null,
      });

      const { getVenues } = await import("./actions");
      const result = await getVenues();

      expect(result).toEqual({ success: false, message: "Not authenticated" });
    });

    it("returns venues ordered by name", async () => {
      const supabase = mockSupabase();
      supabase.order.mockResolvedValue({
        data: [{ id: "1", name: "Café Norr" }],
        error: null,
      });
      vi.mocked(getCurrentUser).mockResolvedValue({
        supabase: supabase as never,
        user: { id: "user-1" } as never,
      });

      const { getVenues } = await import("./actions");
      const result = await getVenues();

      expect(supabase.from).toHaveBeenCalledWith("venues");
      expect(supabase.order).toHaveBeenCalledWith("name");
      expect(result).toEqual({ success: true, venues: [{ id: "1", name: "Café Norr" }] });
    });
  });

  describe("createVenue", () => {
    it("rejects when the user is not an admin", async () => {
      vi.mocked(getUserWithRole).mockResolvedValue({
        supabase: mockSupabase() as never,
        user: { id: "user-1" } as never,
        role: "member",
      });

      const { createVenue } = await import("./actions");
      const result = await createVenue({ name: "Café Norr" });

      expect(result).toEqual({ success: false, message: "Not authorized" });
    });

    it("inserts a venue for an admin and returns it", async () => {
      const supabase = mockSupabase();
      supabase.single.mockResolvedValue({
        data: { id: "venue-1", name: "Café Norr" },
        error: null,
      });
      vi.mocked(getUserWithRole).mockResolvedValue({
        supabase: supabase as never,
        user: { id: "admin-1" } as never,
        role: "admin",
      });

      const { createVenue } = await import("./actions");
      const result = await createVenue({
        name: "Café Norr",
        address: "Storgatan 1",
        city: "Stockholm",
        district: "Södermalm",
        latitude: 59.3,
        longitude: 18.0,
      });

      expect(supabase.insert).toHaveBeenCalledWith({
        name: "Café Norr",
        address: "Storgatan 1",
        city: "Stockholm",
        district: "Södermalm",
        latitude: 59.3,
        longitude: 18.0,
      });
      expect(result).toEqual({
        success: true,
        venue: { id: "venue-1", name: "Café Norr" },
      });
    });

    it("defaults optional fields to null", async () => {
      const supabase = mockSupabase();
      supabase.single.mockResolvedValue({ data: { id: "venue-2", name: "Bar X" }, error: null });
      vi.mocked(getUserWithRole).mockResolvedValue({
        supabase: supabase as never,
        user: { id: "admin-1" } as never,
        role: "admin",
      });

      const { createVenue } = await import("./actions");
      await createVenue({ name: "Bar X" });

      expect(supabase.insert).toHaveBeenCalledWith({
        name: "Bar X",
        address: null,
        city: null,
        district: null,
        latitude: null,
        longitude: null,
      });
    });
  });

  describe("updateVenue", () => {
    it("rejects when the user is not an admin", async () => {
      vi.mocked(getUserWithRole).mockResolvedValue({
        supabase: mockSupabase() as never,
        user: { id: "user-1" } as never,
        role: "member",
      });

      const { updateVenue } = await import("./actions");
      const result = await updateVenue("venue-1", { name: "Café Norr" });

      expect(result).toEqual({ success: false, message: "Not authorized" });
    });

    it("updates the venue for an admin and returns it", async () => {
      const supabase = mockSupabase();
      supabase.eq.mockReturnValue({ select: supabase.select });
      supabase.single.mockResolvedValue({
        data: { id: "venue-1", name: "Café Söder" },
        error: null,
      });
      vi.mocked(getUserWithRole).mockResolvedValue({
        supabase: supabase as never,
        user: { id: "admin-1" } as never,
        role: "admin",
      });

      const { updateVenue } = await import("./actions");
      const result = await updateVenue("venue-1", { name: "Café Söder", city: "Stockholm" });

      expect(supabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Café Söder",
          city: "Stockholm",
          address: null,
          district: null,
          latitude: null,
          longitude: null,
        }),
      );
      expect(supabase.eq).toHaveBeenCalledWith("id", "venue-1");
      expect(result).toEqual({ success: true, venue: { id: "venue-1", name: "Café Söder" } });
    });

    it("returns an error message when the update fails", async () => {
      const supabase = mockSupabase();
      supabase.eq.mockReturnValue({ select: supabase.select });
      supabase.single.mockResolvedValue({ data: null, error: { message: "update failed" } });
      vi.mocked(getUserWithRole).mockResolvedValue({
        supabase: supabase as never,
        user: { id: "admin-1" } as never,
        role: "admin",
      });

      const { updateVenue } = await import("./actions");
      const result = await updateVenue("venue-1", { name: "X" });

      expect(result).toEqual({ success: false, message: "update failed" });
    });
  });

  describe("deleteVenue", () => {
    it("rejects when the user is not an admin", async () => {
      vi.mocked(getUserWithRole).mockResolvedValue({
        supabase: mockSupabase() as never,
        user: { id: "user-1" } as never,
        role: "member",
      });

      const { deleteVenue } = await import("./actions");
      const result = await deleteVenue("venue-1");

      expect(result).toEqual({ success: false, message: "Not authorized" });
    });

    it("deletes the venue if user is admin", async () => {
      const supabase = mockSupabase();
      supabase.eq.mockResolvedValue({ error: null });
      vi.mocked(getUserWithRole).mockResolvedValue({
        supabase: supabase as never,
        user: { id: "admin-1" } as never,
        role: "admin",
      });

      const { deleteVenue } = await import("./actions");
      const result = await deleteVenue("venue-1");

      expect(supabase.delete).toHaveBeenCalled();
      expect(supabase.eq).toHaveBeenCalledWith("id", "venue-1");
      expect(result).toEqual({ success: true });
    });

    it("returns an error message when the delete fails", async () => {
      const supabase = mockSupabase();
      supabase.eq.mockResolvedValue({ error: { message: "delete failed" } });
      vi.mocked(getUserWithRole).mockResolvedValue({
        supabase: supabase as never,
        user: { id: "admin-1" } as never,
        role: "admin",
      });

      const { deleteVenue } = await import("./actions");
      const result = await deleteVenue("venue-1");

      expect(result).toEqual({ success: false, message: "delete failed" });
    });
  });

  describe("createEvent", () => {
    it("rejects when the user is not an admin", async () => {
      vi.mocked(getUserWithRole).mockResolvedValue({
        supabase: mockSupabase() as never,
        user: { id: "user-1" } as never,
        role: "member",
      });

      const { createEvent } = await import("./actions");
      const result = await createEvent({
        name: "Dinner",
        eventDate: "2026-08-01T18:00:00.000Z",
        venueId: null,
      });

      expect(result).toEqual({ success: false, message: "Not authorized" });
    });

    it("inserts an event with the creating admin as created_by", async () => {
      const supabase = mockSupabase();
      supabase.insert.mockReturnValue({ error: null });
      vi.mocked(getUserWithRole).mockResolvedValue({
        supabase: supabase as never,
        user: { id: "admin-1" } as never,
        role: "admin",
      });

      const { createEvent } = await import("./actions");
      const result = await createEvent({
        name: "Dinner",
        eventDate: "2026-08-01T18:00:00.000Z",
        venueId: "venue-1",
        description: "Fun night",
        visibility: "published",
      });

      expect(supabase.insert).toHaveBeenCalledWith({
        name: "Dinner",
        event_date: "2026-08-01T18:00:00.000Z",
        venue_id: "venue-1",
        description: "Fun night",
        visibility: "published",
        co_host_id: null,
        created_by: "admin-1",
      });
      expect(result).toEqual({ success: true, message: "Event created" });
    });

    it("defaults visibility to unpublished", async () => {
      const supabase = mockSupabase();
      supabase.insert.mockReturnValue({ error: null });
      vi.mocked(getUserWithRole).mockResolvedValue({
        supabase: supabase as never,
        user: { id: "admin-1" } as never,
        role: "admin",
      });

      const { createEvent } = await import("./actions");
      await createEvent({ name: "Dinner", eventDate: "2026-08-01T18:00:00.000Z", venueId: null });

      expect(supabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({ visibility: "unpublished" }),
      );
    });

    it("returns an error message when the insert fails", async () => {
      const supabase = mockSupabase();
      supabase.insert.mockReturnValue({ error: { message: "insert failed" } });
      vi.mocked(getUserWithRole).mockResolvedValue({
        supabase: supabase as never,
        user: { id: "admin-1" } as never,
        role: "admin",
      });

      const { createEvent } = await import("./actions");
      const result = await createEvent({
        name: "Dinner",
        eventDate: "2026-08-01T18:00:00.000Z",
        venueId: null,
      });

      expect(result).toEqual({ success: false, message: "insert failed" });
    });

    it("rejects a co-host who is not an admin", async () => {
      vi.mocked(getUserWithRole).mockResolvedValue({
        supabase: mockSupabase() as never,
        user: { id: "co-host-1" } as never,
        role: "member",
      });

      const { createEvent } = await import("./actions");
      const result = await createEvent({
        name: "Dinner",
        eventDate: "2026-08-01T18:00:00.000Z",
        venueId: null,
        coHostId: "co-host-1",
      });

      expect(result).toEqual({ success: false, message: "Not authorized" });
    });
  });

  describe("updateEvent", () => {
    it("rejects when there is no authenticated user", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        supabase: mockSupabase() as never,
        user: null,
      });

      const { updateEvent } = await import("./actions");
      const result = await updateEvent("event-1", { name: "New name" });

      expect(result).toEqual({ success: false, message: "Not authorized" });
    });

    it("only includes fields that were provided", async () => {
      const supabase = mockSupabase();
      supabase.eq.mockResolvedValue({ error: null });
      vi.mocked(getCurrentUser).mockResolvedValue({
        supabase: supabase as never,
        user: { id: "admin-1" } as never,
      });

      const { updateEvent } = await import("./actions");
      const result = await updateEvent("event-1", { name: "New name" });

      expect(supabase.update).toHaveBeenCalledWith(expect.objectContaining({ name: "New name" }));
      const updatePayload = supabase.update.mock.calls[0][0];
      expect(updatePayload).not.toHaveProperty("event_date");
      expect(updatePayload).not.toHaveProperty("venue_id");
      expect(supabase.eq).toHaveBeenCalledWith("id", "event-1");
      expect(result).toEqual({ success: true, message: "Event updated" });
    });

    it("returns an error message when the update fails", async () => {
      const supabase = mockSupabase();
      supabase.eq.mockResolvedValue({ error: { message: "update failed" } });
      vi.mocked(getCurrentUser).mockResolvedValue({
        supabase: supabase as never,
        user: { id: "admin-1" } as never,
      });

      const { updateEvent } = await import("./actions");
      const result = await updateEvent("event-1", { name: "New name" });

      expect(result).toEqual({ success: false, message: "update failed" });
    });

    it("allows a non-admin co-host to update the event (enforced by RLS, not app code)", async () => {
      const supabase = mockSupabase();
      supabase.eq.mockResolvedValue({ error: null });
      vi.mocked(getCurrentUser).mockResolvedValue({
        supabase: supabase as never,
        user: { id: "co-host-1" } as never,
      });

      const { updateEvent } = await import("./actions");
      const result = await updateEvent("event-1", { description: "Updated by co-host" });

      expect(getUserWithRole).not.toHaveBeenCalled();
      expect(supabase.update).toHaveBeenCalledWith(
        expect.objectContaining({ description: "Updated by co-host" }),
      );
      expect(result).toEqual({ success: true, message: "Event updated" });
    });

    it("surfaces the database's rejection when a non-admin, non-co-host member attempts an update", async () => {
      const supabase = mockSupabase();
      supabase.eq.mockResolvedValue({
        error: { message: "new row violates row-level security policy" },
      });
      vi.mocked(getCurrentUser).mockResolvedValue({
        supabase: supabase as never,
        user: { id: "random-member-1" } as never,
      });

      const { updateEvent } = await import("./actions");
      const result = await updateEvent("event-1", { name: "Hijacked name" });

      expect(result).toEqual({
        success: false,
        message: "new row violates row-level security policy",
      });
    });
  });

  describe("deleteEvent", () => {
    it("rejects when the user is not an admin", async () => {
      vi.mocked(getUserWithRole).mockResolvedValue({
        supabase: mockSupabase() as never,
        user: { id: "user-1" } as never,
        role: "member",
      });

      const { deleteEvent } = await import("./actions");
      const result = await deleteEvent("event-1");

      expect(result).toEqual({ success: false, message: "Not authorized" });
    });

    it("deletes the event if user is admin", async () => {
      const supabase = mockSupabase();
      supabase.eq.mockResolvedValue({ error: null });
      vi.mocked(getUserWithRole).mockResolvedValue({
        supabase: supabase as never,
        user: { id: "admin-1" } as never,
        role: "admin",
      });

      const { deleteEvent } = await import("./actions");
      const result = await deleteEvent("event-1");

      expect(supabase.delete).toHaveBeenCalled();
      expect(supabase.eq).toHaveBeenCalledWith("id", "event-1");
      expect(result).toEqual({ success: true, message: "Event deleted" });
    });

    it("returns an error message when the delete fails", async () => {
      const supabase = mockSupabase();
      supabase.eq.mockResolvedValue({ error: { message: "delete failed" } });
      vi.mocked(getUserWithRole).mockResolvedValue({
        supabase: supabase as never,
        user: { id: "admin-1" } as never,
        role: "admin",
      });

      const { deleteEvent } = await import("./actions");
      const result = await deleteEvent("event-1");

      expect(result).toEqual({ success: false, message: "delete failed" });
    });

    it("rejects a co-host who is not an admin", async () => {
      vi.mocked(getUserWithRole).mockResolvedValue({
        supabase: mockSupabase() as never,
        user: { id: "co-host-1" } as never,
        role: "member",
      });

      const { deleteEvent } = await import("./actions");
      const result = await deleteEvent("event-1");

      expect(result).toEqual({ success: false, message: "Not authorized" });
    });
  });

  describe("getInvitations", () => {
    it("rejects when there is no authenticated user", async () => {
      vi.mocked(getUserWithRole).mockResolvedValue({
        supabase: mockSupabase() as never,
        user: null,
        role: null,
      });

      const { getInvitations } = await import("./actions");
      const result = await getInvitations();

      expect(result).toEqual({ success: false, message: "Not authorized" });
    });

    it("rejects when the user is not an admin", async () => {
      vi.mocked(getUserWithRole).mockResolvedValue({
        supabase: mockSupabase() as never,
        user: { id: "user-1" } as never,
        role: "member",
      });

      const { getInvitations } = await import("./actions");
      const result = await getInvitations();

      expect(result).toEqual({ success: false, message: "Not authorized" });
    });

    it("returns invitations ordered by created_at descending for an admin", async () => {
      const supabase = mockSupabase();
      const rows = [
        { id: "2", email: "b@example.com", created_at: "2026-07-05T00:00:00.000Z" },
        { id: "1", email: "a@example.com", created_at: "2026-07-01T00:00:00.000Z" },
      ];
      supabase.order.mockResolvedValue({ data: rows, error: null });
      vi.mocked(getUserWithRole).mockResolvedValue({
        supabase: supabase as never,
        user: { id: "admin-1" } as never,
        role: "admin",
      });

      const { getInvitations } = await import("./actions");
      const result = await getInvitations();

      expect(supabase.from).toHaveBeenCalledWith("invitations");
      expect(supabase.order).toHaveBeenCalledWith("created_at", { ascending: false });
      expect(result).toEqual({ success: true, invitations: rows });
    });

    it("returns an error message when the query fails", async () => {
      const supabase = mockSupabase();
      supabase.order.mockResolvedValue({ data: null, error: { message: "db down" } });
      vi.mocked(getUserWithRole).mockResolvedValue({
        supabase: supabase as never,
        user: { id: "admin-1" } as never,
        role: "admin",
      });

      const { getInvitations } = await import("./actions");
      const result = await getInvitations();

      expect(result).toEqual({ success: false, message: "db down" });
    });
  });

  describe("addInvitation", () => {
    it("rejects when the user is not an admin", async () => {
      vi.mocked(getUserWithRole).mockResolvedValue({
        supabase: mockSupabase() as never,
        user: { id: "user-1" } as never,
        role: "member",
      });

      const { addInvitation } = await import("./actions");
      const result = await addInvitation("new@example.com");

      expect(result).toEqual({ success: false, message: "Not authorized" });
    });

    it("returns 'Email required' for a blank email", async () => {
      const supabase = mockSupabase();
      vi.mocked(getUserWithRole).mockResolvedValue({
        supabase: supabase as never,
        user: { id: "admin-1" } as never,
        role: "admin",
      });

      const { addInvitation } = await import("./actions");
      const result = await addInvitation("   ");

      expect(result).toEqual({ success: false, message: "Email required" });
      expect(supabase.insert).not.toHaveBeenCalled();
    });

    it("normalizes the email, records the inviter, and returns the invitation", async () => {
      const supabase = mockSupabase();
      const invitation = {
        id: "inv-1",
        email: "henrik@example.com",
        created_at: "2026-07-17T00:00:00.000Z",
      };
      supabase.single.mockResolvedValue({ data: invitation, error: null });
      vi.mocked(getUserWithRole).mockResolvedValue({
        supabase: supabase as never,
        user: { id: "admin-1" } as never,
        role: "admin",
      });

      const { addInvitation } = await import("./actions");
      const result = await addInvitation("  Henrik@Example.COM ");

      expect(supabase.from).toHaveBeenCalledWith("invitations");
      expect(supabase.insert).toHaveBeenCalledWith({
        email: "henrik@example.com",
        invited_by: "admin-1",
      });
      expect(result).toEqual({ success: true, invitation });
    });

    it("returns an error message when the insert fails", async () => {
      const supabase = mockSupabase();
      supabase.single.mockResolvedValue({
        data: null,
        error: { message: "duplicate key value violates unique constraint" },
      });
      vi.mocked(getUserWithRole).mockResolvedValue({
        supabase: supabase as never,
        user: { id: "admin-1" } as never,
        role: "admin",
      });

      const { addInvitation } = await import("./actions");
      const result = await addInvitation("dupe@example.com");

      expect(result).toEqual({
        success: false,
        message: "duplicate key value violates unique constraint",
      });
    });
  });

  describe("removeInvitation", () => {
    it("rejects when the user is not an admin", async () => {
      vi.mocked(getUserWithRole).mockResolvedValue({
        supabase: mockSupabase() as never,
        user: { id: "user-1" } as never,
        role: "member",
      });

      const { removeInvitation } = await import("./actions");
      const result = await removeInvitation("inv-1");

      expect(result).toEqual({ success: false, message: "Not authorized" });
    });

    it("deletes the invitation by id for an admin", async () => {
      const supabase = mockSupabase();
      supabase.eq.mockResolvedValue({ error: null });
      vi.mocked(getUserWithRole).mockResolvedValue({
        supabase: supabase as never,
        user: { id: "admin-1" } as never,
        role: "admin",
      });

      const { removeInvitation } = await import("./actions");
      const result = await removeInvitation("inv-1");

      expect(supabase.from).toHaveBeenCalledWith("invitations");
      expect(supabase.delete).toHaveBeenCalled();
      expect(supabase.eq).toHaveBeenCalledWith("id", "inv-1");
      expect(result).toEqual({ success: true });
    });

    it("returns an error message when the delete fails", async () => {
      const supabase = mockSupabase();
      supabase.eq.mockResolvedValue({ error: { message: "delete failed" } });
      vi.mocked(getUserWithRole).mockResolvedValue({
        supabase: supabase as never,
        user: { id: "admin-1" } as never,
        role: "admin",
      });

      const { removeInvitation } = await import("./actions");
      const result = await removeInvitation("inv-1");

      expect(result).toEqual({ success: false, message: "delete failed" });
    });
  });
});
