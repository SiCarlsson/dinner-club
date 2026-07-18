// web/tests/integration/rls/venues.test.ts

import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { anonClient, countRows, createUser, readColumn, resetDb, seedVenue } from "../helpers/db";

describe("venues RLS", () => {
  beforeEach(async () => {
    await resetDb();
  });

  afterAll(async () => {
    await resetDb();
  });

  describe("SELECT", () => {
    it("is readable by anonymous visitors", async () => {
      const venueId = await seedVenue();
      const { data, error } = await anonClient().from("venues").select("id").eq("id", venueId);
      expect(error).toBeNull();
      expect(data).toHaveLength(1);
    });

    it("is readable by members", async () => {
      const venueId = await seedVenue();
      const member = await createUser({ role: "member" });
      const { data } = await member.client.from("venues").select("id").eq("id", venueId);
      expect(data).toHaveLength(1);
    });
  });

  describe("INSERT", () => {
    it("rejects members", async () => {
      const member = await createUser({ role: "member" });
      const { error } = await member.client.from("venues").insert({ name: "Nope" });
      expect(error).not.toBeNull();
    });

    it("allows admins", async () => {
      const admin = await createUser({ role: "admin" });
      const { error } = await admin.client.from("venues").insert({ name: "Yes" });
      expect(error).toBeNull();
    });
  });

  describe("UPDATE", () => {
    it("does not let members change a venue", async () => {
      const venueId = await seedVenue({ name: "Original" });
      const member = await createUser({ role: "member" });

      await member.client.from("venues").update({ name: "Hacked" }).eq("id", venueId);

      expect(await readColumn("venues", "name", venueId)).toBe("Original");
    });

    it("lets admins change a venue", async () => {
      const venueId = await seedVenue({ name: "Original" });
      const admin = await createUser({ role: "admin" });

      const { error } = await admin.client
        .from("venues")
        .update({ name: "Renamed" })
        .eq("id", venueId);
      expect(error).toBeNull();

      expect(await readColumn("venues", "name", venueId)).toBe("Renamed");
    });
  });

  describe("DELETE", () => {
    it("does not let members delete a venue", async () => {
      const venueId = await seedVenue();
      const member = await createUser({ role: "member" });

      await member.client.from("venues").delete().eq("id", venueId);

      expect(await countRows("venues", "id", venueId)).toBe(1); // still there
    });

    it("lets admins delete a venue", async () => {
      const venueId = await seedVenue();
      const admin = await createUser({ role: "admin" });

      await admin.client.from("venues").delete().eq("id", venueId);

      expect(await countRows("venues", "id", venueId)).toBe(0);
    });
  });
});
