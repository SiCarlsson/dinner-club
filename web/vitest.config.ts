// vitest.config.ts

import path from "path";
import react from "@vitejs/plugin-react";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    // Integration + E2E suites run via their own configs (vitest.integration.config.ts
    // and playwright.config.ts) — keep vitest from globbing them, especially the
    // Playwright .spec.ts files, which vitest's default `include` would match.
    exclude: [...configDefaults.exclude, "tests/integration/**", "tests/e2e/**"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./") },
  },
});
