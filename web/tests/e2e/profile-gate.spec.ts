// web/tests/e2e/profile-gate.spec.ts

import { expect, test } from "@playwright/test";
import { fillStable, loginViaPassword } from "./helpers/auth";
import { clearFullName, ensureUser } from "./helpers/db";

const NAMELESS = "e2e-nameless@dinnerclub.test";

test("a member without a name is held on their profile until they set one", async ({ page }) => {
  const id = await ensureUser(NAMELESS, "member");
  await clearFullName(id);

  await loginViaPassword(page, NAMELESS);

  await page.goto("/en/dinners");
  await expect(page).toHaveURL(/\/en\/profile/);
  await expect(page.getByText(/Add your first and last name/)).toBeVisible();

  await fillStable(page.getByLabel("Name"), "Nameless Member");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("button", { name: "Saved" })).toBeVisible();

  await page.goto("/en/dinners");
  await expect(page).toHaveURL(/\/en\/dinners/);
});
