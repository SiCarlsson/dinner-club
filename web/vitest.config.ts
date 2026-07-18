// vitest.config.ts

import path from "path";
import react from "@vitejs/plugin-react";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    // Integration tests need a real Supabase and run via vitest.integration.config.ts.
    exclude: [...configDefaults.exclude, "tests/integration/**"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./") },
  },
});
