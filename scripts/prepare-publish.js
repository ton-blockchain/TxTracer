#!/usr/bin/env node

import fs from "fs"
import path from "path"
import {fileURLToPath} from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, "..")

const publishDir = path.join(rootDir, ".publish-temp")

if (fs.existsSync(publishDir)) {
  fs.rmSync(publishDir, {recursive: true})
}
fs.mkdirSync(publishDir)

console.log("📦 Preparing library for publishing...")

const filesToCopy = [
  "package.json",
  "README-lib.md",
  "LICENSE",
  "src/lib/",
  "src/shared/",
  "src/features/sandbox/",
  "src/features/common/",
  "src/features/txTrace/",
  "src/features/tasm/",
  // "src/features/godbolt/",
  "src/index.css",
]

function copyRecursively(src, dest) {
  const stat = fs.statSync(src)

  if (stat.isDirectory()) {
    fs.mkdirSync(dest, {recursive: true})
    const files = fs.readdirSync(src)

    for (const file of files) {
      copyRecursively(path.join(src, file), path.join(dest, file))
    }
  } else {
    if (src.includes("CodeEditor")) {
      return
    }
    fs.copyFileSync(src, dest)
  }
}

for (const file of filesToCopy) {
  const srcPath = path.join(rootDir, file)
  const destPath = path.join(publishDir, file)

  if (fs.existsSync(srcPath)) {
    copyRecursively(srcPath, destPath)
  }
}

fs.renameSync(path.join(publishDir, "README-lib.md"), path.join(publishDir, "README.md"))

console.log("🔄 Replacing alias imports with relative paths...")

function replaceAliases(filePath, content) {
  const fileDir = path.dirname(filePath)

  let newContent = content

  newContent = newContent.replace(
    'import("@app/pages/SandboxPage/components/TransactionTraceViewer/TransactionTraceViewer"),',
    "new Promise(() => <div></div>),",
  )

  newContent = newContent.replace(/"@shared\/(.+?)"/g, (match, importPath) => {
    const sharedPath = path.join(publishDir, "src/shared", importPath)
    const relativePath = path.relative(fileDir, sharedPath)
    return `"./${relativePath.replace(/\\/g, "/")}"`
  })

  newContent = newContent.replace(/"@features\/(.+?)"/g, (match, importPath) => {
    const featuresPath = path.join(publishDir, "src/features", importPath)
    const relativePath = path.relative(fileDir, featuresPath)
    return `"./${relativePath.replace(/\\/g, "/")}"`
  })

  newContent = newContent.replace(/"@entities\/(.+?)"/g, (match, importPath) => {
    const entitiesPath = path.join(publishDir, "src/entities", importPath)
    const relativePath = path.relative(fileDir, entitiesPath)
    return `"./${relativePath.replace(/\\/g, "/")}"`
  })

  newContent = newContent.replace(/"@app\/(.+?)"/g, (match, importPath) => {
    const appPath = path.join(publishDir, "src", importPath)
    const relativePath = path.relative(fileDir, appPath)
    return `"./${relativePath.replace(/\\/g, "/")}"`
  })

  return newContent
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir)

  for (const file of files) {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)

    if (stat.isDirectory()) {
      processDirectory(filePath)
    } else if (file.endsWith(".ts") || file.endsWith(".tsx")) {
      const content = fs.readFileSync(filePath, "utf8")
      const newContent = replaceAliases(filePath, content)

      if (content !== newContent) {
        fs.writeFileSync(filePath, newContent)
        console.log(`  ✓ Updated ${path.relative(publishDir, filePath)}`)
      }
    }
  }
}

processDirectory(path.join(publishDir, "src"))

console.log("✅ Library prepared for publishing!")
console.log(`📁 Files ready in: ${publishDir}`)
console.log("")
console.log("Next steps:")
console.log(`  cd ${publishDir}`)
console.log("  npm pack --dry-run  # Check package contents")
console.log("  npm publish         # Publish to npm")
console.log("")
