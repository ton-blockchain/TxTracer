export interface AsmInstruction {
  readonly mnemonic: string
  readonly doc: {
    readonly opcode: string
    readonly stack: string
    readonly category: string
    readonly description: string
    readonly gas: string
    readonly fift: string
    readonly fift_examples: {
      readonly fift: string
      readonly description: string
    }[]
  }
  readonly since_version: number
  readonly alias_info?: AsmAlias
}

export interface AsmAlias {
  readonly mnemonic: string
  readonly alias_of: string
  readonly doc_fift?: string
  readonly doc_stack?: string
  readonly description?: string
  readonly operands: Record<string, number | string | undefined>
}

export interface AsmData {
  readonly instructions: AsmInstruction[]
  readonly aliases: AsmAlias[]
}

let data: AsmData | null = null
let isLoading = false
let loadInitiated = false

async function fetchAsmData(): Promise<AsmData | null> {
  if (data) return data
  if (isLoading) return null

  isLoading = true
  try {
    const response = await fetch("/assets/asm/asm.json")
    if (!response.ok) {
      console.error("Failed to fetch asm.json:", response.statusText)
      return null
    }
    data = (await response.json()) as AsmData
    return data
  } catch (error) {
    console.error("Error fetching or parsing asm.json:", error)
    return null
  } finally {
    isLoading = false
  }
}

export function asmData(): AsmData | null | undefined {
  if (data) {
    return data
  }
  if (!loadInitiated) {
    loadInitiated = true
    void fetchAsmData() // data will be populated asynchronously
  }
  return undefined // no data for now
}

export function findInstruction(name: string): AsmInstruction | null | undefined {
  const data = asmData()
  if (data === undefined) return undefined // data aren't loaded yet

  const realName = adjustName(name)
  const instruction = data?.instructions.find(i => i.mnemonic === realName)
  if (instruction) {
    return instruction
  }

  const alias = data?.aliases.find(i => i.mnemonic === name)
  if (alias) {
    const instruction = data?.instructions.find(i => i.mnemonic === alias.alias_of)
    if (instruction) {
      return {
        ...instruction,
        alias_info: alias,
      }
    }
  }

  return null
}

function adjustName(name: string): string {
  if (name === "PUSHINT") {
    return "PUSHINT_4"
  }
  if (name === "XCHG0") {
    return "XCHG_0I"
  }
  if (name === "XCHG") {
    return "XCHG_IJ"
  }
  return name
}

export function getStackPresentation(rawStack: string | undefined): string {
  if (!rawStack) return ""
  const trimmedStack = rawStack.trim()
  const prefix = trimmedStack.startsWith("-") ? "∅ " : ""
  const suffix = trimmedStack.endsWith("-") ? " ∅" : ""
  const stack = prefix + rawStack.replace("-", "→") + suffix
  return `(${stack})`
}
