import js from "@eslint/js"
import globals from "globals"
import reactPlugin from "eslint-plugin-react"
import reactHooks from "eslint-plugin-react-hooks"
import reactRefresh from "eslint-plugin-react-refresh"
import tseslint from "typescript-eslint"
import eslintPluginJsxA11y from "eslint-plugin-jsx-a11y"
import eslintPluginImport from "eslint-plugin-import"
import eslintConfigPrettier from "eslint-config-prettier"
import unusedImports from "eslint-plugin-unused-imports"
import functional from "eslint-plugin-functional"

export default tseslint.config(
  {
    ignores: [
      "dist",
      "src/polyfills.ts",
      "src/features/godbolt/lib/func/func-wasm/func-compile.ts",
      "src/features/godbolt/lib/func/func-wasm/funcfiftlib.d.ts",
      ".test-project/",
      ".yarn",
    ],
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommendedTypeChecked],
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
      import: eslintPluginImport,
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
      "import/order": [
        "warn",
        {
          groups: ["builtin", "external", "internal", "parent", "sibling", "index"],
          "newlines-between": "always-and-inside-groups",
        },
      ],
      "import/no-unresolved": "off",
      "import/named": "error",
      "import/namespace": "error",
      "import/default": "error",
      "import/export": "error",
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
      "import/resolver": {
        typescript: {
          project: "./tsconfig.eslint.json",
        },
        node: true,
      },
    },
  },
  eslintConfigPrettier,
)
