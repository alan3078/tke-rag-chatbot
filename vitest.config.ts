import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["apps/web/**/__tests__/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["apps/web/lib/**"],
      // Per-file thresholds: only tested files must meet 60%.
      // Global threshold will be enforced once all features have tests.
      thresholds: {
        "apps/web/lib/chunking.ts": {
          statements: 60,
          branches: 60,
          functions: 60,
          lines: 60,
        },
        "apps/web/lib/embeddings.ts": {
          statements: 60,
          branches: 60,
          functions: 60,
          lines: 60,
        },
        "apps/web/lib/segmentation.ts": {
          statements: 60,
          branches: 60,
          functions: 60,
          lines: 60,
        },
        "apps/web/lib/constants.ts": {
          statements: 60,
          branches: 60,
          functions: 60,
          lines: 60,
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "apps/web"),
    },
  },
});
