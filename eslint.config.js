import js from "@eslint/js"
import globals from "globals"
import reactPlugin from "eslint-plugin-react"
import reactHooks from "eslint-plugin-react-hooks"
import reactRefresh from "eslint-plugin-react-refresh"
import tseslint from "typescript-eslint"
import eslintPluginJsxA11y from "eslint-plugin-jsx-a11y"
import {importX} from "eslint-plugin-import-x"
import eslintConfigPrettier from "eslint-config-prettier"
import unusedImports from "eslint-plugin-unused-imports"
import functional from "eslint-plugin-functional"
import * as tsResolver from "eslint-import-resolver-typescript"

export default tseslint.config(
  {
    ignores: [
      "dist",
      "src/polyfills.ts",
      "src/env.d.ts",
      "spec/src/env.d.ts",
      "spec/src/content/config.ts",
      "spec/.astro/**/*",
      "src/features/godbolt/lib/func/func-wasm/func-compile.ts",
      "src/features/godbolt/lib/func/func-wasm/funcfiftlib.d.ts",
      ".test-project/",
      ".yarn",
    ],
  },
  {
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
      importX.flatConfigs.recommended,
      importX.flatConfigs.typescript,
    ],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parser: tseslint.parser,
      parserOptions: {
        project: ["./tsconfig.eslint.json"],
        tsconfigRootDir: import.meta.dirname,
        ecmaFeatures: {jsx: true},
      },
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin,
      react: reactPlugin,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      "jsx-a11y": eslintPluginJsxA11y,
      "import-x": importX,
      "@unused-imports": unusedImports,
      functional: functional,
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactPlugin.configs["jsx-runtime"].rules,
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", {allowConstantExport: true}],
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      ...eslintPluginJsxA11y.configs.recommended.rules,
      "import-x/order": [
        "warn",
        {
          groups: ["builtin", "external", "internal", "parent", "sibling", "index"],
          "newlines-between": "always-and-inside-groups",
        },
      ],
      "import-x/no-unresolved": "off",
      "import-x/named": "error",
      "import-x/namespace": "error",
      "import-x/default": "error",
      "import-x/export": "error",
      "@unused-imports/no-unused-imports": "error",
      "jsx-a11y/no-autofocus": "off",
      "functional/type-declaration-immutability": [
        "error",
        {
          rules: [
            {
              identifiers: ".+",
              immutability: "ReadonlyShallow",
              comparator: "AtLeast",
            },
          ],
        },
      ],
    },
    settings: {
      react: {
        version: "detect",
      },
      "import-x/resolver": {
        name: "tsResolver",
        resolver: tsResolver,
      },
    },
  },
  {
    files: ["e2e-tests/**/*.{ts,js}"],
    rules: {
      "react-hooks/rules-of-hooks": "off",
      "react-hooks/exhaustive-deps": "off",
      "react/prop-types": "off",
      "react/react-in-jsx-scope": "off",
      "react/jsx-uses-react": "off",
      "react/jsx-uses-vars": "off",
    },
  },
  eslintConfigPrettier,
)
