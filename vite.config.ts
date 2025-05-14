/// <reference types="vitest" />
import {resolve} from "path"

import {defineConfig} from "vite"
import react from "@vitejs/plugin-react"
import viteCompression from "vite-plugin-compression"

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      "@shared": resolve(__dirname, "src/shared"),
      "@features": resolve(__dirname, "src/features"),
      "@entities": resolve(__dirname, "src/entities"),
      "@app": resolve(__dirname, "src"),
    },
  },
  base: "./",
  plugins: [react(), viteCompression(), viteCompression({algorithm: "brotliCompress", ext: ".br"})],
  build: {
    target: ["es2020"],
    rollupOptions: {
      output: {
        manualChunks: {
          "ton-vendor": ["@ton/core", "@ton/crypto", "@ton/sandbox"],
          "monaco-editor-core": ["monaco-editor"],
        },
      },
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      target: "es2020",
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["src/setupTests.ts"],
    // coverage: {
    //   reporter: ["text", "json", "html"],
    //   provider: "v8", // or "istanbul"
    // },
  },
})
