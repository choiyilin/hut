import { defineConfig, globalIgnores } from "eslint/config"
import js from "@eslint/js"
import tseslint from "typescript-eslint"
import nextVitals from "eslint-config-next/core-web-vitals"
import nextTs from "eslint-config-next/typescript"
import prettier from "eslint-config-prettier"
import globals from "globals"

export default defineConfig([
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "node_modules/**",
    "next-env.d.ts",
    "eslint.config.mjs",
    "postcss.config.mjs",
    "next.config.ts",
    "commitlint.config.mjs",
  ]),

  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  ...nextVitals,
  ...nextTs,

  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      // Hard bans — non-negotiable.
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error",
      "@typescript-eslint/no-unnecessary-type-assertion": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "separate-type-imports" },
      ],
      "@typescript-eslint/consistent-type-definitions": ["error", "type"],
      "@typescript-eslint/no-import-type-side-effects": "error",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "error",
      "no-console": ["error", { allow: ["warn", "error"] }],
      "no-restricted-syntax": [
        "error",
        {
          selector: "TSAsExpression:not([typeAnnotation.type='TSLiteralType'])",
          message:
            "Type assertions are banned. Use Zod to parse at boundaries, or `as const` for literals.",
        },
        {
          selector:
            "MemberExpression[object.type='MemberExpression'][object.object.name='process'][object.property.name='env']",
          message:
            "Read environment variables via @/env/client or @/env/server — not process.env directly.",
        },
      ],

      // Phase 0 softeners — these will clear up as Phase 1 adds Zod schemas at
      // boundaries, removing the `any` flow that triggers the unsafe-* family.
      // Once Phase 1 lands, promote each of these back to "error".
      "@typescript-eslint/no-confusing-void-expression": "off",
      "@typescript-eslint/no-unnecessary-condition": "warn",
      "@typescript-eslint/restrict-template-expressions": "warn",
      "@typescript-eslint/no-unsafe-assignment": "warn",
      "@typescript-eslint/no-unsafe-member-access": "warn",
      "@typescript-eslint/no-unsafe-call": "warn",
      "@typescript-eslint/no-unsafe-argument": "warn",
      "@typescript-eslint/no-unsafe-return": "warn",
      "@typescript-eslint/no-deprecated": "warn",
      "@typescript-eslint/no-empty-function": "off",
      "react-hooks/set-state-in-effect": "warn",
    },
  },

  // The env module IS the boundary — it's the only place allowed to read process.env.
  {
    files: ["src/env/**/*.ts"],
    rules: { "no-restricted-syntax": "off" },
  },

  // Config files and scripts may use console; loosen strict rules.
  {
    files: ["*.config.*", "scripts/**/*"],
    rules: { "no-console": "off" },
  },

  // Phase 0 transition: disable the strictest bans for legacy paths that will be
  // rewritten during Phase 1-7 (schemas/domain/adapters/features). As each file
  // moves into src/, it loses this exemption and inherits the strict rules.
  // Phase 7 deletes this block entirely.
  {
    files: [
      "app/**/*.{ts,tsx}",
      "components/**/*.{ts,tsx}",
      "contexts/**/*.{ts,tsx}",
      "lib/**/*.{ts,tsx}",
      "types/**/*.{ts,tsx}",
      "proxy.ts",
    ],
    rules: {
      "no-restricted-syntax": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-misused-promises": "off",
      "@typescript-eslint/no-floating-promises": "off",
      "@typescript-eslint/no-non-null-asserted-nullish-coalescing": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-unnecessary-condition": "off",
      "@typescript-eslint/restrict-template-expressions": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-unnecessary-type-assertion": "off",
      "@typescript-eslint/no-deprecated": "off",
      "@typescript-eslint/no-empty-function": "off",
      "@typescript-eslint/consistent-type-definitions": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/error-boundaries": "off",
      "react-hooks/exhaustive-deps": "off",
      "no-empty": "off",
    },
  },

  // Disable stylistic rules that conflict with Prettier (must come last).
  prettier,
])
