import { defineConfig, globalIgnores } from "eslint/config"
import nextVitals from "eslint-config-next/core-web-vitals"
import nextTs from "eslint-config-next/typescript"

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // eslint-plugin-react crashes on `version: "detect"` under flat config
  // (it calls the removed eslintrc-context API). Pin the installed React
  // version instead.
  {
    settings: {
      react: { version: "19.2.8" },
    },
  },
  {
    rules: {
      // Codebase conventions, deliberately relaxed (see git history of this
      // file if you tighten these):
      // - `any` is used by convention for SDK payloads, metadata casts and
      //   caught errors (102 sites). Type-hardening them is a separate effort.
      "@typescript-eslint/no-explicit-any": "off",
      // - react-hooks v7 rule that bans setState-in-effect; the storefront's
      //   ubiquitous sync-from-props pattern (cart → form state, etc.) relies
      //   on it. Enforcing requires a state-derivation refactor.
      "react-hooks/set-state-in-effect": "off",
      // - Plain anchors are used for internal pages in a few places; moving
      //   every one to <Link> is a small, separate cleanup.
      "@next/next/no-html-link-for-pages": "off",
      // - require() appears in config/bootstrap files where it is appropriate.
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "public/**",
    // Playwright e2e suite — its dependencies are not installed with the app,
    // so it lives outside the lint scope.
    "e2e/**",
  ]),
])

export default eslintConfig
