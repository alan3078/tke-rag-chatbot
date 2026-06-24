import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["apps/backend/__tests__/e2e/**/*.e2e-spec.ts"],
    root: path.resolve(__dirname, "../.."),
    testTimeout: 15000,
    pool: "forks",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
