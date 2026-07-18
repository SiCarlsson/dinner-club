// web/tests/e2e/admin.spec.ts

import { expect, test } from "@playwright/test";
import { ADMIN_STATE, MEMBER_STATE } from "./helpers/auth";

test.describe("as a member", () => {
  test.use({ storageState: MEMBER_STATE });

  test("is redirected away from /admin", async ({ page }) => {
    await page.goto("/en/admin");
    await expect(page).not.toHaveURL(/\/admin/);
  });
});

test.describe("as an admin", () => {
  test.use({ storageState: ADMIN_STATE });

  test("can open /admin", async ({ page }) => {
    await page.goto("/en/admin");
    await expect(page).toHaveURL(/\/en\/admin/);
  });
});
