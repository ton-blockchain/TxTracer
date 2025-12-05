import {Cell} from "@ton/core"
import {runtime as i, text, trace} from "ton-assembly"

import type {InstructionInfo} from "ton-source-map"

import {FUNC_STDLIB} from "@features/godbolt/lib/func/stdlib.ts"
import {funcCompile} from "@features/godbolt/lib/func/func-wasm/func-compile.ts"

export interface FuncCompilationResult {
  readonly lang: "func"
  readonly instructions: i.Instr[]
  readonly code: string
  readonly assembly: string
  readonly sourceMap?: trace.FuncMapping
  readonly mapping: Map<number, InstructionInfo[]>
}

export class FuncCompilationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "FuncCompilationError"
  }
}

export const compileFuncCode = async (code: string): Promise<FuncCompilationResult | undefined> => {
  const result = await funcCompile({
    entries: ["main.fc"],
    sources: [
      {
        path: "stdlib.fc",
        content: FUNC_STDLIB,
      },
      {
        path: "main.fc",
        content: code,
      },
    ],
    debugInfo: true,
  })

  if (!result.ok) {
    throw new FuncCompilationError(result.log)
  }

  const codeCell = Cell.fromBoc(result.output)[0]

  const initialInstructions = i.decompileCell(codeCell)
  const [, mapping] = recompileCell(codeCell)

  const mappingInfo = trace.createMappingInfo(mapping)

  const allInstructions = [...Object.values(mappingInfo.cells)].flatMap(cell => {
    return cell?.instructions ?? []
  })

  const debugSectionToInstructions = new Map<number, InstructionInfo[]>()

  for (const instr of allInstructions) {
    for (const debugSection of instr.debugSections) {
      const arr = debugSectionToInstructions.get(debugSection) ?? []
      arr.push(instr)
      debugSectionToInstructions.set(debugSection, arr)
    }
  }

  return {
    lang: "func",
    instructions: initialInstructions,
    code: code,
    assembly: text.print(initialInstructions),
    sourceMap: result.sourceMap,
    mapping: debugSectionToInstructions,
  }
}

export const recompileCell = (cell: Cell): [Cell, i.Mapping] => {
  const instructionsWithoutPositions = i.decompileCell(cell)
  const assemblyForPositions = text.print(instructionsWithoutPositions)

  const parseResult = text.parse("out.tasm", assemblyForPositions)
  if (parseResult.$ === "ParseFailure") {
    throw new Error("Cannot parse resulting text Assembly")
  }

  return i.compileCellWithMapping(parseResult.instructions)
}
