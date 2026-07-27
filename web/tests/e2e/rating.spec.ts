// web/tests/e2e/rating.spec.ts

import { expect, test } from "@playwright/test";
import { MEMBER_EMAIL, MEMBER_STATE } from "./helpers/auth";
import {
  deleteDinner,
  deleteVenue,
  ensureUser,
  seedDinner,
  seedRsvp,
  seedVenue,
} from "./helpers/db";

test.use({ storageState: MEMBER_STATE });

const stamp = Date.now();
const venueName = `E2E Venue ${stamp}`;
const dinnerName = `E2E Past Dinner ${stamp}`;
let venueId: string;
let dinnerId: string;

test.beforeAll(async () => {
  const memberId = await ensureUser(MEMBER_EMAIL, "member");
  venueId = await seedVenue(venueName);
  dinnerId = await seedDinner({
    name: dinnerName,
    venueId,
    visibility: "published",
    dinnerDate: new Date(Date.now() - 24 * 3600 * 1000), // yesterday → rateable
  });
  await seedRsvp(dinnerId, memberId, "attending"); // attendance is required to rate
});

test.afterAll(async () => {
  await deleteDinner(dinnerId); // cascades to the rating/rsvp
  await deleteVenue(venueId);
});

test("rating a past dinner surfaces the venue in the guide", async ({ page }) => {
  await page.goto("/en/dinners");

  await page.getByRole("button", { name: new RegExp(dinnerName) }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  const fifthStars = dialog.getByRole("button", { name: "5 of 5" });
  await expect(fifthStars).toHaveCount(3);
  for (let i = 0; i < 3; i++) await fifthStars.nth(i).click();

  await dialog.getByRole("button", { name: /Save rating|Update rating/ }).click();
  await expect(dialog.getByRole("button", { name: "Saved" })).toBeVisible();

  await page.goto("/en/guide");
  await expect(page.getByText(venueName)).toBeVisible();
});
