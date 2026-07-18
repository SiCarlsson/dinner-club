// web/tests/integration/helpers/setup.ts

import { afterAll } from "vitest";
import { closePool } from "./db";

afterAll(async () => {
  await closePool();
});
