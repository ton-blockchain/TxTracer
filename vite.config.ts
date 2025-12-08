/// <reference types="vitest" />
import {resolve} from "path"
import {writeFileSync} from "fs"

import {defineConfig} from "vite"
import react from "@vitejs/plugin-react"

const createCNAME = () => ({
  name: "create-cname",
  writeBundle() {
    const domain = process.env.CUSTOM_DOMAIN ?? "txtracer.ton.org"
    writeFileSync(resolve(__dirname, "dist/CNAME"), `${domain}\n`)
  },
})

const createRobotsTxt = () => ({
  name: "create-tobots-txt",
  writeBundle() {
    const robotsContent = "User-Agent: *\nAllow: /"
    writeFileSync(resolve(__dirname, "dist/robots.txt"), `${robotsContent}\n`)
  },
})

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
  plugins: [
    react(),
    createCNAME(),
    createRobotsTxt(),
    // Bundle analyzer
    // visualizer({
    //   filename: "dist/stats.html",
    //   open: false,
    //   gzipSize: true,
    //   brotliSize: true,
    // }),
  ],
  build: {
    target: ["es2020"],
    chunkSizeWarningLimit: 8 * 1024 * 1024,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        play: resolve(__dirname, "play/index.html"),
        sandbox: resolve(__dirname, "sandbox/index.html"),
        emulate: resolve(__dirname, "emulate/index.html"),
        "code-explorer": resolve(__dirname, "code-explorer/index.html"),
        spec: resolve(__dirname, "spec/index.html"),
      },
      output: {
        manualChunks: {
          "ton-vendor": ["@ton/core", "@ton/ton"],
          "ton-sandbox": ["@ton/sandbox"],
          "monaco-editor-core": ["monaco-editor"],
          "ton-assembly": ["ton-assembly"],
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
    include: ["src/**/*.spec.ts", "src/**/*.test.ts"],
    exclude: ["e2e-tests/**"],
    // coverage: {
    //   reporter: ["text", "json", "html"],
    //   provider: "v8", // or "istanbul"
    // },
  },
})
