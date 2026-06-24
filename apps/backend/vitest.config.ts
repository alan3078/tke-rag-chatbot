import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["apps/backend/__tests__/**/*.spec.ts", "apps/backend/__tests__/**/*.test.ts"],
    root: path.resolve(__dirname, "../.."),
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
