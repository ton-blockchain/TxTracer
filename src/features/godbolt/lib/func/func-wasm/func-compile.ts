import {trace} from "ton-assembly-test-dev/dist"

// Convert base64 to Uint8Array for browser compatibility
function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes
}

// Browser polyfill for CommonJS modules
function setupCommonJSPolyfill() {
  if (typeof globalThis.module === "undefined") {
    // @ts-ignore
    globalThis.module = {exports: {}}
  }
  if (typeof globalThis.exports === "undefined") {
    globalThis.exports = globalThis.module.exports
  }
}

let CompilerModule: (_: object) => any | undefined
let WasmBinary: Uint8Array | undefined

// Dynamic imports for WASM modules
async function loadWasmModules() {
  // Setup CommonJS polyfill before loading modules
  setupCommonJSPolyfill()

  try {
    // @ts-ignore
    await import("./funcfiftlib.js")

    CompilerModule ??= globalThis.module.exports

    // @ts-ignore
    await import("./funcfiftlib.wasm.js")
    const wasmBase64String = globalThis.module.exports.FuncFiftLibWasm

    WasmBinary ??= base64ToUint8Array(wasmBase64String)

    return {
      CompilerModule: CompilerModule,
      WasmBinary,
    }
  } catch (error) {
    console.error("Failed to load WASM modules:", error)
    throw error
  }
}

type Pointer = unknown
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const writeToCString = (mod: any, data: string): Pointer => {
  const len = mod.lengthBytesUTF8(data) + 1
  const ptr = mod._malloc(len)
  mod.stringToUTF8(data, ptr, len)
  return ptr
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const writeToCStringPtr = (mod: any, str: string, ptr: any) => {
  const allocated = writeToCString(mod, str)
  mod.setValue(ptr, allocated, "*")
  return allocated
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const readFromCString = (mod: any, pointer: Pointer): string => mod.UTF8ToString(pointer)

function cutFirstLine(src: string) {
  return src.slice(src.indexOf("\n") + 1)
}

export type FuncCompilationResult =
  | {
      ok: false
      log: string
      fift: string | null
      output: Buffer | null
    }
  | {
      ok: true
      log: string
      fift: string
      output: Buffer
      sourceMap: undefined | trace.FuncMapping
    }

type CompileResult =
  | {
      status: "error"
      message: string
    }
  | {
      status: "ok"
      codeBoc: string
      fiftCode: string
      warnings: string
      debugInfo: undefined | trace.FuncMapping
    }

export type FuncConfig = {
  sources: string[]
  optLevel: number
  debugInfo: boolean
}

export async function funcCompile(args: {
  entries: string[]
  sources: {path: string; content: string}[]
  debugInfo: boolean
}): Promise<FuncCompilationResult> {
  await loadWasmModules()

  // Parameters
  const files: string[] = args.entries
  const config: FuncConfig = {
    sources: files,
    optLevel: 2, // compileConfig.optLevel || 2
    debugInfo: args.debugInfo,
  }
  const configStr = JSON.stringify(config)

  // Pointer tracking
  const allocatedPointers: Pointer[] = []
  const allocatedFunctions: Pointer[] = []
  const trackPointer = (pointer: Pointer): Pointer => {
    allocatedPointers.push(pointer)
    return pointer
  }
  const trackFunctionPointer = (pointer: Pointer): Pointer => {
    allocatedFunctions.push(pointer)
    return pointer
  }

  // Create module
  const logs: string[] = []
  const mod = await CompilerModule({
    wasmBinary: WasmBinary,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    printErr: (e: any) => {
      logs.push(e)
    },
  })

  // Execute
  try {
    // Write config
    const configPointer = trackPointer(writeToCString(mod, configStr))

    // FS emulation callback
    const callbackPtr = trackFunctionPointer(
      mod.addFunction(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (_kind: any, _data: any, contents: any, error: any) => {
          const kind: string = readFromCString(mod, _kind)
          const data: string = readFromCString(mod, _data)
          if (kind === "realpath") {
            allocatedPointers.push(writeToCStringPtr(mod, data, contents))
          } else if (kind === "source") {
            try {
              const fl = args.sources.find(v => v.path === data)
              if (!fl) {
                throw Error("File not found: " + data)
              }
              allocatedPointers.push(writeToCStringPtr(mod, fl.content, contents))
            } catch (err) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const e = err as any
              allocatedPointers.push(
                writeToCStringPtr(mod, "message" in e ? e.message : e.toString(), error),
              )
            }
          } else {
            allocatedPointers.push(writeToCStringPtr(mod, "Unknown callback kind " + kind, error))
          }
        },
        "viiii",
      ),
    )

    // Execute
    const resultPointer = trackPointer(mod._func_compile(configPointer, callbackPtr))
    const retJson = readFromCString(mod, resultPointer)
    const result = JSON.parse(retJson) as CompileResult

    const msg = logs.join("\n")

    switch (result.status) {
      case "error": {
        return {
          ok: false,
          log: logs.length > 0 ? msg : result.message ? result.message : "Unknown error",
          fift: null,
          output: null,
        }
      }
      case "ok": {
        return {
          ok: true,
          log: logs.length > 0 ? msg : result.warnings ? result.warnings : "",
          fift: cutFirstLine(result.fiftCode.replace(/\n/g, "\n")),
          output: Buffer.from(result.codeBoc, "base64"),
          sourceMap: result.debugInfo,
        }
      }
    }
  } catch (e) {
    throw Error("Unexpected compiler response")
  } finally {
    for (const i of allocatedFunctions) {
      mod.removeFunction(i)
    }
    for (const i of allocatedPointers) {
      mod._free(i)
    }
  }
  throw Error("Unexpected compiler response")
}
