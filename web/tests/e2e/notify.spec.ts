// web/tests/e2e/notify.spec.ts

import { expect, test } from "@playwright/test";
import { ADMIN_STATE, MEMBER_STATE } from "./helpers/auth";
import { clearPushSubscriptions, deleteEvent, seedEvent } from "./helpers/db";

let eventId: string;

test.beforeAll(async () => {
  eventId = await seedEvent({ name: `E2E Notify Dinner ${Date.now()}` });
});

test.afterAll(async () => {
  await deleteEvent(eventId);
});

test.describe("admin", () => {
  test.use({ storageState: ADMIN_STATE });

  test("can notify subscribers from the event dialog", async ({ page }) => {
    await clearPushSubscriptions();

    await page.goto("/en/events");
    await page.getByRole("button", { name: "See who's coming" }).first().click();

    const dialog = page.getByRole("dialog");
    const notify = dialog.getByRole("button", { name: "Notify members" });
    await expect(notify).toBeVisible();

    await notify.click();

    await expect(dialog.getByRole("button", { name: "Notification sent" })).toBeVisible();
  });
});

test.describe("member", () => {
  test.use({ storageState: MEMBER_STATE });

  test("does not see the notify button", async ({ page }) => {
    await page.goto("/en/events");
    await page.getByRole("button", { name: "See who's coming" }).first().click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Notify members" })).toHaveCount(0);
  });
});
