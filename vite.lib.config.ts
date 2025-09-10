import {resolve} from "path"

import {defineConfig} from "vite"
import react from "@vitejs/plugin-react"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@shared": resolve(__dirname, "src/shared"),
      "@features": resolve(__dirname, "src/features"),
      "@entities": resolve(__dirname, "src/entities"),
      "@app": resolve(__dirname, "src"),
    },
  },
  build: {
    lib: {
      entry: {
        // Main index file
        index: resolve(__dirname, "src/lib/index.ts"),

        // Shared components and utilities - all in one file
        shared: resolve(__dirname, "src/lib/shared.ts"),

        // Features components and utilities - all in one file
        features: resolve(__dirname, "src/lib/features.ts"),
      },
      formats: ["es"],
      fileName: (format, entryName) => `${entryName}.js`,
    },
    outDir: "dist/lib",
    rollupOptions: {
      external: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "@monaco-editor/react",
        "monaco-editor",
        "@ton/core",
        "@ton/crypto",
        "@ton/sandbox",
        "@ton/test-utils",
        "@ton/tolk-js",
        "@ton-community/func-js",
        "@truecarry/tlb-abi",
        "@xyflow/react",
        "allotment",
        "buffer",
        "framer-motion",
        "react-d3-tree",
        "react-helmet-async",
        "react-icons",
        "react-markdown",
        "ton-assembly",
        "txtracer-core",
      ],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
          "react/jsx-runtime": "jsxRuntime",
        },
        assetFileNames: assetInfo => {
          if (assetInfo.name === "style.css") return "txtracer.css"
          return assetInfo.name ?? "asset"
        },
      },
    },
    cssCodeSplit: false,
  },
})
