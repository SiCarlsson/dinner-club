// web/tests/e2e/notify.spec.ts

import { expect, test } from "@playwright/test";
import { ADMIN_STATE, MEMBER_STATE } from "./helpers/auth";
import { clearPushSubscriptions, deleteDinner, seedDinner } from "./helpers/db";

let dinnerId: string;

test.beforeAll(async () => {
  dinnerId = await seedDinner({ name: `E2E Notify Dinner ${Date.now()}` });
});

test.afterAll(async () => {
  await deleteDinner(dinnerId);
});

test.describe("admin", () => {
  test.use({ storageState: ADMIN_STATE });

  test("can notify subscribers from the dinner dialog", async ({ page }) => {
    await clearPushSubscriptions();

    await page.goto("/en/dinners");
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
    await page.goto("/en/dinners");
    await page.getByRole("button", { name: "See who's coming" }).first().click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Notify members" })).toHaveCount(0);
  });
});
