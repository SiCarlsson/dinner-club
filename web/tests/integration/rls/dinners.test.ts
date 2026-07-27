// web/tests/integration/rls/dinners.test.ts

import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { countRows, createUser, readColumn, resetDb, seedDinner } from "../helpers/db";

describe("dinners RLS", () => {
  beforeEach(async () => {
    await resetDb();
  });

  afterAll(async () => {
    await resetDb();
  });

  describe("SELECT visibility", () => {
    it("members see published but NOT unpublished dinners", async () => {
      const publishedId = await seedDinner({ visibility: "published" });
      const unpublishedId = await seedDinner({ visibility: "unpublished" });
      const member = await createUser({ role: "member" });

      const { data } = await member.client.from("dinners").select("id");
      const ids = (data ?? []).map((e) => e.id);
      expect(ids).toContain(publishedId);
      expect(ids).not.toContain(unpublishedId);
    });

    it("admins see unpublished dinners", async () => {
      const unpublishedId = await seedDinner({ visibility: "unpublished" });
      const admin = await createUser({ role: "admin" });

      const { data } = await admin.client.from("dinners").select("id").eq("id", unpublishedId);
      expect(data).toHaveLength(1);
    });

    it("a host sees their own unpublished dinner", async () => {
      const host = await createUser({ role: "member" });
      const unpublishedId = await seedDinner({ visibility: "unpublished", host_id: host.id });

      const { data } = await host.client.from("dinners").select("id").eq("id", unpublishedId);
      expect(data).toHaveLength(1);
    });

    it("a member is NOT a host of someone else's unpublished dinner", async () => {
      const host = await createUser({ role: "member" });
      const other = await createUser({ role: "member" });
      const unpublishedId = await seedDinner({ visibility: "unpublished", host_id: host.id });

      const { data } = await other.client.from("dinners").select("id").eq("id", unpublishedId);
      expect(data).toHaveLength(0);
    });
  });

  describe("INSERT", () => {
    it("rejects members", async () => {
      const member = await createUser({ role: "member" });
      const { error } = await member.client.from("dinners").insert({
        name: "Nope",
        dinner_date: new Date().toISOString(),
        rsvp_deadline: new Date().toISOString(),
        created_by: member.id,
      });
      expect(error).not.toBeNull();
    });

    it("allows admins when created_by is themselves", async () => {
      const admin = await createUser({ role: "admin" });
      const { error } = await admin.client.from("dinners").insert({
        name: "Yes",
        dinner_date: new Date().toISOString(),
        rsvp_deadline: new Date().toISOString(),
        created_by: admin.id,
      });
      expect(error).toBeNull();
    });

    it("rejects admins who spoof created_by as another user", async () => {
      const admin = await createUser({ role: "admin" });
      const other = await createUser({ role: "member" });
      const { error } = await admin.client.from("dinners").insert({
        name: "Spoof",
        dinner_date: new Date().toISOString(),
        rsvp_deadline: new Date().toISOString(),
        created_by: other.id,
      });
      expect(error).not.toBeNull();
    });
  });

  describe("UPDATE", () => {
    it("lets a host update their dinner", async () => {
      const host = await createUser({ role: "member" });
      const dinnerId = await seedDinner({
        visibility: "published",
        host_id: host.id,
        name: "Before",
      });

      const { error } = await host.client
        .from("dinners")
        .update({ name: "After" })
        .eq("id", dinnerId);
      expect(error).toBeNull();

      expect(await readColumn("dinners", "name", dinnerId)).toBe("After");
    });

    it("does not let an unrelated member update an dinner", async () => {
      const dinnerId = await seedDinner({ visibility: "published", name: "Before" });
      const member = await createUser({ role: "member" });

      await member.client.from("dinners").update({ name: "Hacked" }).eq("id", dinnerId);

      expect(await readColumn("dinners", "name", dinnerId)).toBe("Before");
    });

    it("does not let a host reassign the dinner to someone else", async () => {
      const host = await createUser({ role: "member" });
      const other = await createUser({ role: "member" });
      const dinnerId = await seedDinner({ visibility: "published", host_id: host.id });

      const { error } = await host.client
        .from("dinners")
        .update({ host_id: other.id })
        .eq("id", dinnerId);

      // WITH CHECK rejects the new row because the host would no longer be the host.
      expect(error).not.toBeNull();
      expect(await readColumn("dinners", "host_id", dinnerId)).toBe(host.id);
    });
  });

  describe("DELETE", () => {
    it("does not let a host delete their dinner (admins only)", async () => {
      const host = await createUser({ role: "member" });
      const dinnerId = await seedDinner({ visibility: "published", host_id: host.id });

      await host.client.from("dinners").delete().eq("id", dinnerId);

      expect(await countRows("dinners", "id", dinnerId)).toBe(1);
    });

    it("lets admins delete an dinner", async () => {
      const dinnerId = await seedDinner({ visibility: "published" });
      const admin = await createUser({ role: "admin" });

      await admin.client.from("dinners").delete().eq("id", dinnerId);

      expect(await countRows("dinners", "id", dinnerId)).toBe(0);
    });
  });
});
