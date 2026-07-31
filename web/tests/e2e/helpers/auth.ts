// web/tests/e2e/helpers/auth.ts

import { expect, type Locator, type Page } from "@playwright/test";
import { getOtpCode } from "./mailpit";

export async function fillStable(input: Locator, value: string): Promise<void> {
  await expect(async () => {
    await input.fill(value);
    await expect(input).toHaveValue(value);
  }).toPass({ timeout: 15_000 });
}

export const MEMBER_EMAIL = "e2e-member@dinnerclub.test";
export const ADMIN_EMAIL = "e2e-admin@dinnerclub.test";

export const MEMBER_STATE = "tests/e2e/.auth/member.json";
export const ADMIN_STATE = "tests/e2e/.auth/admin.json";

export async function loginViaOtpCode(page: Page, email: string): Promise<void> {
  const start = Date.now();

  await page.goto("/en/login");
  await fillStable(page.getByLabel("Email"), email);
  await page.getByRole("button", { name: "Send code" }).click();
  await expect(page.getByText("Enter your code")).toBeVisible();

  const code = await getOtpCode(email, start);
  await fillStable(page.getByLabel("Code"), code);
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).not.toHaveURL(/\/login/);
}
