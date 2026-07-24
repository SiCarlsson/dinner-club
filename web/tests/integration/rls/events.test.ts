// web/tests/integration/rls/events.test.ts

import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { countRows, createUser, readColumn, resetDb, seedEvent } from "../helpers/db";

describe("events RLS", () => {
  beforeEach(async () => {
    await resetDb();
  });

  afterAll(async () => {
    await resetDb();
  });

  describe("SELECT visibility", () => {
    it("members see published but NOT unpublished events", async () => {
      const publishedId = await seedEvent({ visibility: "published" });
      const unpublishedId = await seedEvent({ visibility: "unpublished" });
      const member = await createUser({ role: "member" });

      const { data } = await member.client.from("events").select("id");
      const ids = (data ?? []).map((e) => e.id);
      expect(ids).toContain(publishedId);
      expect(ids).not.toContain(unpublishedId);
    });

    it("admins see unpublished events", async () => {
      const unpublishedId = await seedEvent({ visibility: "unpublished" });
      const admin = await createUser({ role: "admin" });

      const { data } = await admin.client.from("events").select("id").eq("id", unpublishedId);
      expect(data).toHaveLength(1);
    });

    it("a co-host sees their own unpublished event", async () => {
      const coHost = await createUser({ role: "member" });
      const unpublishedId = await seedEvent({ visibility: "unpublished", co_host_id: coHost.id });

      const { data } = await coHost.client.from("events").select("id").eq("id", unpublishedId);
      expect(data).toHaveLength(1);
    });

    it("a member is NOT a co-host of someone else's unpublished event", async () => {
      const coHost = await createUser({ role: "member" });
      const other = await createUser({ role: "member" });
      const unpublishedId = await seedEvent({ visibility: "unpublished", co_host_id: coHost.id });

      const { data } = await other.client.from("events").select("id").eq("id", unpublishedId);
      expect(data).toHaveLength(0);
    });
  });

  describe("INSERT", () => {
    it("rejects members", async () => {
      const member = await createUser({ role: "member" });
      const { error } = await member.client.from("events").insert({
        name: "Nope",
        event_date: new Date().toISOString(),
        rsvp_deadline: new Date().toISOString(),
        created_by: member.id,
      });
      expect(error).not.toBeNull();
    });

    it("allows admins when created_by is themselves", async () => {
      const admin = await createUser({ role: "admin" });
      const { error } = await admin.client.from("events").insert({
        name: "Yes",
        event_date: new Date().toISOString(),
        rsvp_deadline: new Date().toISOString(),
        created_by: admin.id,
      });
      expect(error).toBeNull();
    });

    it("rejects admins who spoof created_by as another user", async () => {
      const admin = await createUser({ role: "admin" });
      const other = await createUser({ role: "member" });
      const { error } = await admin.client.from("events").insert({
        name: "Spoof",
        event_date: new Date().toISOString(),
        rsvp_deadline: new Date().toISOString(),
        created_by: other.id,
      });
      expect(error).not.toBeNull();
    });
  });

  describe("UPDATE", () => {
    it("lets a co-host update their event", async () => {
      const coHost = await createUser({ role: "member" });
      const eventId = await seedEvent({
        visibility: "published",
        co_host_id: coHost.id,
        name: "Before",
      });

      const { error } = await coHost.client
        .from("events")
        .update({ name: "After" })
        .eq("id", eventId);
      expect(error).toBeNull();

      expect(await readColumn("events", "name", eventId)).toBe("After");
    });

    it("does not let an unrelated member update an event", async () => {
      const eventId = await seedEvent({ visibility: "published", name: "Before" });
      const member = await createUser({ role: "member" });

      await member.client.from("events").update({ name: "Hacked" }).eq("id", eventId);

      expect(await readColumn("events", "name", eventId)).toBe("Before");
    });
  });

  describe("DELETE", () => {
    it("does not let a co-host delete their event (admins only)", async () => {
      const coHost = await createUser({ role: "member" });
      const eventId = await seedEvent({ visibility: "published", co_host_id: coHost.id });

      await coHost.client.from("events").delete().eq("id", eventId);

      expect(await countRows("events", "id", eventId)).toBe(1);
    });

    it("lets admins delete an event", async () => {
      const eventId = await seedEvent({ visibility: "published" });
      const admin = await createUser({ role: "admin" });

      await admin.client.from("events").delete().eq("id", eventId);

      expect(await countRows("events", "id", eventId)).toBe(0);
    });
  });
});
