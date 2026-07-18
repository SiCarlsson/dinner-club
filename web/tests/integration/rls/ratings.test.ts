// web/tests/integration/rls/ratings.test.ts

import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { countRows, createUser, resetDb, seedEvent, seedRsvp } from "../helpers/db";

const PAST = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
const FUTURE = new Date(Date.now() + 24 * 3600 * 1000).toISOString();

/** A valid, in-the-past event the given user is attending. */
async function pastEventAttendedBy(userId: string): Promise<string> {
  const eventId = await seedEvent({ visibility: "published", event_date: PAST });
  await seedRsvp(eventId, userId);
  return eventId;
}

const VALID_SCORES = { drinks_rating: 5, food_rating: 4, venue_rating: 3 };

describe("ratings RLS", () => {
  beforeEach(async () => {
    await resetDb();
  });

  afterAll(async () => {
    await resetDb();
  });

  describe("INSERT", () => {
    it("lets an attendee rate a past event they attended", async () => {
      const member = await createUser({ role: "member" });
      const eventId = await pastEventAttendedBy(member.id);

      const { error } = await member.client
        .from("ratings")
        .insert({ event_id: eventId, user_id: member.id, ...VALID_SCORES });
      expect(error).toBeNull();
    });

    it("rejects rating a future event", async () => {
      const member = await createUser({ role: "member" });
      const eventId = await seedEvent({ visibility: "published", event_date: FUTURE });
      await seedRsvp(eventId, member.id);

      const { error } = await member.client
        .from("ratings")
        .insert({ event_id: eventId, user_id: member.id, ...VALID_SCORES });
      expect(error).not.toBeNull();
    });

    it("rejects rating an event the member did not attend", async () => {
      const member = await createUser({ role: "member" });
      const eventId = await seedEvent({ visibility: "published", event_date: PAST }); // no RSVP

      const { error } = await member.client
        .from("ratings")
        .insert({ event_id: eventId, user_id: member.id, ...VALID_SCORES });
      expect(error).not.toBeNull();
    });

    it("rejects rating on behalf of another user", async () => {
      const member = await createUser({ role: "member" });
      const other = await createUser({ role: "member" });
      const eventId = await pastEventAttendedBy(other.id);

      const { error } = await member.client
        .from("ratings")
        .insert({ event_id: eventId, user_id: other.id, ...VALID_SCORES });
      expect(error).not.toBeNull();
    });
  });

  describe("UPDATE", () => {
    it("lets a member update their own rating", async () => {
      const member = await createUser({ role: "member" });
      const eventId = await pastEventAttendedBy(member.id);
      await member.client
        .from("ratings")
        .insert({ event_id: eventId, user_id: member.id, ...VALID_SCORES });

      const { error } = await member.client
        .from("ratings")
        .update({ food_rating: 1 })
        .eq("event_id", eventId)
        .eq("user_id", member.id);
      expect(error).toBeNull();
    });
  });

  describe("DELETE", () => {
    it("does not let a member delete their own rating (admins only)", async () => {
      const member = await createUser({ role: "member" });
      const eventId = await pastEventAttendedBy(member.id);
      await member.client
        .from("ratings")
        .insert({ event_id: eventId, user_id: member.id, ...VALID_SCORES });

      await member.client.from("ratings").delete().eq("event_id", eventId).eq("user_id", member.id);

      expect(await countRows("ratings", "event_id", eventId)).toBe(1); // still there
    });
  });
});
