// web/tests/e2e/rsvps.spec.ts

import { expect, test } from "@playwright/test";
import { MEMBER_STATE } from "./helpers/auth";
import { deleteDinner, seedDinner } from "./helpers/db";

test.use({ storageState: MEMBER_STATE });

let dinnerId: string;

test.beforeAll(async () => {
  dinnerId = await seedDinner({ name: `E2E Upcoming Dinner ${Date.now()}` });
});

test.afterAll(async () => {
  await deleteDinner(dinnerId);
});

test("member can mark themselves as attending", async ({ page }) => {
  await page.goto("/en/dinners");

  const attend = page.getByRole("button", { name: "I'm coming" }).first();
  await expect(attend).toBeVisible();

  await attend.click();
  await expect(attend).toHaveAttribute("aria-pressed", "true");
});
