// web/tests/integration/rls/invitations.test.ts

import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { countRows, createUser, resetDb, seedInvitation } from "../helpers/db";

describe("invitations RLS", () => {
  beforeEach(async () => {
    await resetDb();
  });

  afterAll(async () => {
    await resetDb();
  });

  it("hides the whitelist from members", async () => {
    await seedInvitation("guest@example.com");
    const member = await createUser({ role: "member" });

    const { data } = await member.client.from("invitations").select("id");
    // The member's own invitation exists too, but RLS returns nothing to non-admins.
    expect(data).toHaveLength(0);
  });

  it("lets admins read the whitelist", async () => {
    await seedInvitation("guest@example.com");
    const admin = await createUser({ role: "admin" });

    const { data } = await admin.client
      .from("invitations")
      .select("email")
      .eq("email", "guest@example.com");
    expect(data).toHaveLength(1);
  });

  it("rejects members adding invitations", async () => {
    const member = await createUser({ role: "member" });
    const { error } = await member.client
      .from("invitations")
      .insert({ email: "sneaky@example.com" });
    expect(error).not.toBeNull();
  });

  it("lets admins add invitations", async () => {
    const admin = await createUser({ role: "admin" });
    const { error } = await admin.client
      .from("invitations")
      .insert({ email: "welcome@example.com" });
    expect(error).toBeNull();
  });

  it("does not let members remove invitations", async () => {
    await seedInvitation("guest@example.com");
    const member = await createUser({ role: "member" });

    await member.client.from("invitations").delete().eq("email", "guest@example.com");

    expect(await countRows("invitations", "email", "guest@example.com")).toBe(1); // still there
  });
});
