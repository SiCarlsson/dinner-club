// web/tests/e2e/auth.spec.ts

import { test as setup } from "@playwright/test";
import {
  ADMIN_EMAIL,
  ADMIN_STATE,
  loginViaMagicLink,
  MEMBER_EMAIL,
  MEMBER_STATE,
} from "./helpers/auth";
import { ensureUser } from "./helpers/db";

setup("authenticate member", async ({ page }) => {
  await ensureUser(MEMBER_EMAIL, "member");
  await loginViaMagicLink(page, MEMBER_EMAIL);
  await page.context().storageState({ path: MEMBER_STATE });
});

setup("authenticate admin", async ({ page }) => {
  await ensureUser(ADMIN_EMAIL, "admin");
  await loginViaMagicLink(page, ADMIN_EMAIL);
  await page.context().storageState({ path: ADMIN_STATE });
});
