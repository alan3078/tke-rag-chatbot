import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";

export default tseslint.config(
  // Global ignores
  {
    ignores: ["node_modules/", ".next/", "apps/web/.next/", "dist/", "coverage/"],
  },

  // Base TypeScript rules for all .ts/.tsx files
  ...tseslint.configs.recommended,

  // Project-specific rules
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      // No magic strings — enforce enum/const usage
      "no-restricted-syntax": [
        "warn",
        {
          selector: "Literal[value='user']",
          message: "Use MessageRole.User from @/lib/constants instead of magic string 'user'.",
        },
        {
          selector: "Literal[value='assistant']",
          message:
            "Use MessageRole.Assistant from @/lib/constants instead of magic string 'assistant'.",
        },
      ],

      // DRY: no unused variables (except prefixed with _)
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],

      // No any — enforce proper typing
      "@typescript-eslint/no-explicit-any": "error",

      // Prefer const
      "prefer-const": "error",

      // No console.log in lib/ (use structured logging)
      // Allow in scripts/ (CLI tools)
      "no-console": "off",
    },
  },

  // Stricter rules for lib/ — no console.log
  {
    files: ["apps/web/lib/**/*.ts"],
    ignores: ["apps/web/lib/__tests__/**"],
    rules: {
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },

  // Constants file — enum definitions legitimately contain string values
  {
    files: ["**/lib/constants.ts"],
    rules: {
      "no-restricted-syntax": "off",
    },
  },

  // Relaxed rules for test files
  {
    files: ["**/__tests__/**/*.ts", "**/*.test.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "no-restricted-syntax": "off",
    },
  },

  // Prettier must be last — disables conflicting formatting rules
  eslintConfigPrettier,
);
