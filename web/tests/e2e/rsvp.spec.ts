// web/tests/e2e/rsvps.spec.ts

import { expect, test } from "@playwright/test";
import { MEMBER_STATE } from "./helpers/auth";
import { deleteEvent, seedEvent } from "./helpers/db";

test.use({ storageState: MEMBER_STATE });

let eventId: string;

test.beforeAll(async () => {
  eventId = await seedEvent({ name: `E2E Upcoming Dinner ${Date.now()}` });
});

test.afterAll(async () => {
  await deleteEvent(eventId);
});

test("member can mark themselves as attending", async ({ page }) => {
  await page.goto("/en/events");

  const attend = page.getByRole("button", { name: "I'm coming" }).first();
  await expect(attend).toBeVisible();

  await attend.click();
  await expect(attend).toHaveAttribute("aria-pressed", "true");
});
