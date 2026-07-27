// web/tests/integration/rls/rsvps.test.ts

import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { countRows, createUser, resetDb, seedDinner, seedRsvp } from "../helpers/db";

describe("rsvps RLS", () => {
  beforeEach(async () => {
    await resetDb();
  });

  afterAll(async () => {
    await resetDb();
  });

  describe("INSERT", () => {
    it("lets a member RSVP to a published dinner", async () => {
      const dinnerId = await seedDinner({ visibility: "published" });
      const member = await createUser({ role: "member" });

      const { error } = await member.client
        .from("rsvps")
        .insert({ dinner_id: dinnerId, user_id: member.id, status: "attending" });
      expect(error).toBeNull();
    });

    it("rejects RSVPing on behalf of another user", async () => {
      const dinnerId = await seedDinner({ visibility: "published" });
      const member = await createUser({ role: "member" });
      const victim = await createUser({ role: "member" });

      const { error } = await member.client
        .from("rsvps")
        .insert({ dinner_id: dinnerId, user_id: victim.id, status: "attending" });
      expect(error).not.toBeNull();
    });

    it("rejects RSVPing to an unpublished dinner the member cannot see", async () => {
      const dinnerId = await seedDinner({ visibility: "unpublished" });
      const member = await createUser({ role: "member" });

      const { error } = await member.client
        .from("rsvps")
        .insert({ dinner_id: dinnerId, user_id: member.id, status: "attending" });
      expect(error).not.toBeNull();
    });
  });

  describe("SELECT", () => {
    it("lets a member see another attendee's RSVP on a visible dinner", async () => {
      const dinnerId = await seedDinner({ visibility: "published" });
      const attendee = await createUser({ role: "member" });
      const viewer = await createUser({ role: "member" });

      await seedRsvp(dinnerId, attendee.id);

      const { data } = await viewer.client.from("rsvps").select("id").eq("dinner_id", dinnerId);
      expect(data).toHaveLength(1);
    });

    it("hides RSVPs on unpublished dinners from unrelated members", async () => {
      const dinnerId = await seedDinner({ visibility: "unpublished" });
      const attendee = await createUser({ role: "member" });
      const viewer = await createUser({ role: "member" });

      await seedRsvp(dinnerId, attendee.id);

      const { data } = await viewer.client.from("rsvps").select("id").eq("dinner_id", dinnerId);
      expect(data).toHaveLength(0);
    });
  });

  describe("UPDATE", () => {
    it("lets a member change their own RSVP", async () => {
      const dinnerId = await seedDinner({ visibility: "published" });
      const member = await createUser({ role: "member" });
      await member.client
        .from("rsvps")
        .insert({ dinner_id: dinnerId, user_id: member.id, status: "attending" });

      const { error } = await member.client
        .from("rsvps")
        .update({ status: "declined" })
        .eq("dinner_id", dinnerId)
        .eq("user_id", member.id);
      expect(error).toBeNull();
    });
  });

  describe("DELETE", () => {
    it("lets a member delete their own RSVP", async () => {
      const dinnerId = await seedDinner({ visibility: "published" });
      const member = await createUser({ role: "member" });
      await member.client
        .from("rsvps")
        .insert({ dinner_id: dinnerId, user_id: member.id, status: "attending" });

      await member.client.from("rsvps").delete().eq("dinner_id", dinnerId).eq("user_id", member.id);

      expect(await countRows("rsvps", "dinner_id", dinnerId)).toBe(0);
    });

    it("does not let a member delete another member's RSVP", async () => {
      const dinnerId = await seedDinner({ visibility: "published" });
      const attendee = await createUser({ role: "member" });
      const other = await createUser({ role: "member" });
      await seedRsvp(dinnerId, attendee.id);

      await other.client
        .from("rsvps")
        .delete()
        .eq("dinner_id", dinnerId)
        .eq("user_id", attendee.id);

      expect(await countRows("rsvps", "dinner_id", dinnerId)).toBe(1);
    });

    it("lets an admin delete any member's RSVP", async () => {
      const dinnerId = await seedDinner({ visibility: "published" });
      const attendee = await createUser({ role: "member" });
      const admin = await createUser({ role: "admin" });
      await seedRsvp(dinnerId, attendee.id);

      await admin.client
        .from("rsvps")
        .delete()
        .eq("dinner_id", dinnerId)
        .eq("user_id", attendee.id);

      expect(await countRows("rsvps", "dinner_id", dinnerId)).toBe(0);
    });
  });
});
