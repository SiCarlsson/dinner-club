// web/tests/integration/rls/push-subscriptions.test.ts

import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { countRows, createUser, resetDb, type TestUser } from "../helpers/db";

let endpointCounter = 0;
function uniqueEndpoint() {
  return `https://push.example/${Date.now()}-${endpointCounter++}`;
}

async function insertOwnSubscription(user: TestUser, endpoint: string) {
  return user.client.from("push_subscriptions").insert({
    user_id: user.id,
    endpoint,
    p256dh: "p256dh-key",
    auth: "auth-key",
  });
}

describe("push_subscriptions RLS", () => {
  beforeEach(async () => {
    await resetDb();
  });

  afterAll(async () => {
    await resetDb();
  });

  describe("INSERT", () => {
    it("lets a user add their own subscription", async () => {
      const user = await createUser({ role: "member" });

      const { error } = await insertOwnSubscription(user, uniqueEndpoint());
      expect(error).toBeNull();
    });

    it("rejects adding a subscription on behalf of another user", async () => {
      const user = await createUser({ role: "member" });
      const victim = await createUser({ role: "member" });

      const { error } = await user.client.from("push_subscriptions").insert({
        user_id: victim.id,
        endpoint: uniqueEndpoint(),
        p256dh: "p256dh-key",
        auth: "auth-key",
      });
      expect(error).not.toBeNull();
    });
  });

  describe("SELECT", () => {
    it("lets a user see their own subscription", async () => {
      const user = await createUser({ role: "member" });
      await insertOwnSubscription(user, uniqueEndpoint());

      const { data } = await user.client.from("push_subscriptions").select("id");
      expect(data).toHaveLength(1);
    });

    it("hides another user's subscription", async () => {
      const owner = await createUser({ role: "member" });
      const snooper = await createUser({ role: "member" });
      await insertOwnSubscription(owner, uniqueEndpoint());

      const { data } = await snooper.client.from("push_subscriptions").select("id");
      expect(data).toHaveLength(0);
    });
  });

  describe("DELETE", () => {
    // Regression: deleting by endpoint needs SELECT privilege + a SELECT policy,
    // otherwise the WHERE clause errors / matches no rows and the unsubscribe fails.
    it("lets a user delete their own subscription by endpoint", async () => {
      const user = await createUser({ role: "member" });
      const endpoint = uniqueEndpoint();
      await insertOwnSubscription(user, endpoint);

      const { error } = await user.client
        .from("push_subscriptions")
        .delete()
        .eq("endpoint", endpoint);

      expect(error).toBeNull();
      expect(await countRows("push_subscriptions", "endpoint", endpoint)).toBe(0);
    });

    it("does not let a user delete another user's subscription", async () => {
      const owner = await createUser({ role: "member" });
      const attacker = await createUser({ role: "member" });
      const endpoint = uniqueEndpoint();
      await insertOwnSubscription(owner, endpoint);

      await attacker.client.from("push_subscriptions").delete().eq("endpoint", endpoint);

      expect(await countRows("push_subscriptions", "endpoint", endpoint)).toBe(1); // still there
    });
  });
});
