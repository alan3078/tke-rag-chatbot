import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["apps/web/**/*.test.ts", "apps/web/**/*.test.tsx"],
    environmentMatchGlobs: [
      ["apps/web/components/**", "jsdom"],
      ["apps/web/providers/**", "jsdom"],
    ],
    setupFiles: ["apps/web/test/setup-ui.ts"],
    coverage: {
      provider: "v8",
      include: [
        "apps/web/components/**",
        "apps/web/providers/**",
        "apps/web/hooks/**",
        "apps/web/services/**",
        "apps/web/lib/**",
      ],
      thresholds: {
        "apps/web/services/api-client.ts": {
          statements: 60,
          branches: 60,
          functions: 60,
          lines: 60,
        },
      },
    },
  },
  esbuild: {
    jsx: "automatic",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "apps/web"),
    },
  },
});
