import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  // ✅ TypeScript-specific rule override
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      "no-undef": "off",
    },
    ignorePatterns: [
      // Ignore files in the "components/ui" directory from linting, as they are auto-generated.
      "components/ui/**",
    ],
  },

  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
