// web/tests/integration/rls/ratings.test.ts

import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { countRows, createUser, resetDb, seedDinner, seedRsvp } from "../helpers/db";

const PAST = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
const FUTURE = new Date(Date.now() + 24 * 3600 * 1000).toISOString();

/** A valid, in-the-past dinner the given user is attending. */
async function pastDinnerAttendedBy(userId: string): Promise<string> {
  const dinnerId = await seedDinner({ visibility: "published", dinner_date: PAST });
  await seedRsvp(dinnerId, userId);
  return dinnerId;
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
    it("lets an attendee rate a past dinner they attended", async () => {
      const member = await createUser({ role: "member" });
      const dinnerId = await pastDinnerAttendedBy(member.id);

      const { error } = await member.client
        .from("ratings")
        .insert({ dinner_id: dinnerId, user_id: member.id, ...VALID_SCORES });
      expect(error).toBeNull();
    });

    it("rejects rating a future dinner", async () => {
      const member = await createUser({ role: "member" });
      const dinnerId = await seedDinner({ visibility: "published", dinner_date: FUTURE });
      await seedRsvp(dinnerId, member.id);

      const { error } = await member.client
        .from("ratings")
        .insert({ dinner_id: dinnerId, user_id: member.id, ...VALID_SCORES });
      expect(error).not.toBeNull();
    });

    it("rejects rating an dinner the member did not attend", async () => {
      const member = await createUser({ role: "member" });
      const dinnerId = await seedDinner({ visibility: "published", dinner_date: PAST }); // no RSVP

      const { error } = await member.client
        .from("ratings")
        .insert({ dinner_id: dinnerId, user_id: member.id, ...VALID_SCORES });
      expect(error).not.toBeNull();
    });

    it("rejects rating on behalf of another user", async () => {
      const member = await createUser({ role: "member" });
      const other = await createUser({ role: "member" });
      const dinnerId = await pastDinnerAttendedBy(other.id);

      const { error } = await member.client
        .from("ratings")
        .insert({ dinner_id: dinnerId, user_id: other.id, ...VALID_SCORES });
      expect(error).not.toBeNull();
    });
  });

  describe("UPDATE", () => {
    it("lets a member update their own rating", async () => {
      const member = await createUser({ role: "member" });
      const dinnerId = await pastDinnerAttendedBy(member.id);
      await member.client
        .from("ratings")
        .insert({ dinner_id: dinnerId, user_id: member.id, ...VALID_SCORES });

      const { error } = await member.client
        .from("ratings")
        .update({ food_rating: 1 })
        .eq("dinner_id", dinnerId)
        .eq("user_id", member.id);
      expect(error).toBeNull();
    });
  });

  describe("DELETE", () => {
    it("does not let a member delete their own rating (admins only)", async () => {
      const member = await createUser({ role: "member" });
      const dinnerId = await pastDinnerAttendedBy(member.id);
      await member.client
        .from("ratings")
        .insert({ dinner_id: dinnerId, user_id: member.id, ...VALID_SCORES });

      await member.client
        .from("ratings")
        .delete()
        .eq("dinner_id", dinnerId)
        .eq("user_id", member.id);

      expect(await countRows("ratings", "dinner_id", dinnerId)).toBe(1); // still there
    });
  });
});
