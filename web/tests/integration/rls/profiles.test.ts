// web/tests/integration/rls/profiles.test.ts

import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createUser, readColumn, resetDb } from "../helpers/db";

describe("profiles RLS", () => {
  beforeEach(async () => {
    await resetDb();
  });

  afterAll(async () => {
    await resetDb();
  });

  it("lets a member read other members' profiles", async () => {
    const a = await createUser({ role: "member" });
    const b = await createUser({ role: "member" });

    const { data } = await a.client.from("profiles").select("id").eq("id", b.id);
    expect(data).toHaveLength(1);
  });

  it("lets a member update their own profile", async () => {
    const member = await createUser({ role: "member" });

    const { error } = await member.client
      .from("profiles")
      .update({ full_name: "New Name" })
      .eq("id", member.id);
    expect(error).toBeNull();

    expect(await readColumn("profiles", "full_name", member.id)).toBe("New Name");
  });

  it("does not let a member update someone else's profile", async () => {
    const member = await createUser({ role: "member" });
    const victim = await createUser({ role: "member" });

    await member.client.from("profiles").update({ full_name: "Tampered" }).eq("id", victim.id);

    expect(await readColumn("profiles", "full_name", victim.id)).not.toBe("Tampered");
  });

  it("does not let a member escalate their own role to admin", async () => {
    // RLS allows the UPDATE (it's their row), so the real guard is that the app
    // never grants column-level rights to flip `role`. This documents the intent:
    // if this ever starts passing with role = 'admin', a privilege-escalation
    // hole has opened. See the profiles migration's GRANT/columns.
    const member = await createUser({ role: "member" });

    await member.client.from("profiles").update({ role: "admin" }).eq("id", member.id);

    expect(await readColumn("profiles", "role", member.id)).toBe("member");
  });
});
