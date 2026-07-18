// web/tests/integration/rls/rsvps.test.ts

import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { countRows, createUser, resetDb, seedEvent, seedRsvp } from "../helpers/db";

describe("rsvps RLS", () => {
  beforeEach(async () => {
    await resetDb();
  });

  afterAll(async () => {
    await resetDb();
  });

  describe("INSERT", () => {
    it("lets a member RSVP to a published event", async () => {
      const eventId = await seedEvent({ visibility: "published" });
      const member = await createUser({ role: "member" });

      const { error } = await member.client
        .from("rsvps")
        .insert({ event_id: eventId, user_id: member.id, status: "attending" });
      expect(error).toBeNull();
    });

    it("rejects RSVPing on behalf of another user", async () => {
      const eventId = await seedEvent({ visibility: "published" });
      const member = await createUser({ role: "member" });
      const victim = await createUser({ role: "member" });

      const { error } = await member.client
        .from("rsvps")
        .insert({ event_id: eventId, user_id: victim.id, status: "attending" });
      expect(error).not.toBeNull();
    });

    it("rejects RSVPing to an unpublished event the member cannot see", async () => {
      const eventId = await seedEvent({ visibility: "unpublished" });
      const member = await createUser({ role: "member" });

      const { error } = await member.client
        .from("rsvps")
        .insert({ event_id: eventId, user_id: member.id, status: "attending" });
      expect(error).not.toBeNull();
    });
  });

  describe("SELECT", () => {
    it("lets a member see another attendee's RSVP on a visible event", async () => {
      const eventId = await seedEvent({ visibility: "published" });
      const attendee = await createUser({ role: "member" });
      const viewer = await createUser({ role: "member" });

      await seedRsvp(eventId, attendee.id);

      const { data } = await viewer.client.from("rsvps").select("id").eq("event_id", eventId);
      expect(data).toHaveLength(1);
    });

    it("hides RSVPs on unpublished events from unrelated members", async () => {
      const eventId = await seedEvent({ visibility: "unpublished" });
      const attendee = await createUser({ role: "member" });
      const viewer = await createUser({ role: "member" });

      await seedRsvp(eventId, attendee.id);

      const { data } = await viewer.client.from("rsvps").select("id").eq("event_id", eventId);
      expect(data).toHaveLength(0);
    });
  });

  describe("UPDATE", () => {
    it("lets a member change their own RSVP", async () => {
      const eventId = await seedEvent({ visibility: "published" });
      const member = await createUser({ role: "member" });
      await member.client
        .from("rsvps")
        .insert({ event_id: eventId, user_id: member.id, status: "attending" });

      const { error } = await member.client
        .from("rsvps")
        .update({ status: "declined" })
        .eq("event_id", eventId)
        .eq("user_id", member.id);
      expect(error).toBeNull();
    });
  });

  describe("DELETE", () => {
    it("does not let a member delete their own RSVP (admins only)", async () => {
      const eventId = await seedEvent({ visibility: "published" });
      const member = await createUser({ role: "member" });
      await member.client
        .from("rsvps")
        .insert({ event_id: eventId, user_id: member.id, status: "attending" });

      await member.client.from("rsvps").delete().eq("event_id", eventId).eq("user_id", member.id);

      expect(await countRows("rsvps", "event_id", eventId)).toBe(1); // still there
    });
  });
});
