// web/tests/e2e/login.spec.ts

import { expect, test } from "@playwright/test";
import { fillStable } from "./helpers/auth";
import { seedInvitation } from "./helpers/db";

const INVITED = "e2e-invited@dinnerclub.test";

test.beforeAll(async () => {
  await seedInvitation(INVITED);
});

test("an invited email is sent a login link", async ({ page }) => {
  await page.goto("/en/login");
  await fillStable(page.getByLabel("Email"), INVITED);
  await page.getByRole("button", { name: "Send login link" }).click();

  await expect(page.getByText("Check your email")).toBeVisible();
});

test("an uninvited email is told they are not a member", async ({ page }) => {
  await page.goto("/en/login");
  await fillStable(page.getByLabel("Email"), `nobody-${Date.now()}@example.com`);
  await page.getByRole("button", { name: "Send login link" }).click();

  await expect(page.getByText("You're not a member")).toBeVisible();
});

test("a protected route redirects a logged-out visitor to login", async ({ page }) => {
  await page.goto("/en/events");
  await expect(page).toHaveURL(/\/login/);
});
