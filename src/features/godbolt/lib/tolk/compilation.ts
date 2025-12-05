import {Cell} from "@ton/core"
import {runtime as i, text, trace} from "ton-assembly"

import type {InstructionInfo} from "ton-source-map"
import {runTolkCompiler} from "@ton/tolk-js"

import {TolkCompilationError, type TolkCompilationResult} from "@features/godbolt/lib/tolk/types.ts"

export const compileTolkCode = async (code: string): Promise<TolkCompilationResult | undefined> => {
  const result = await runTolkCompiler({
    entrypointFileName: "main.tolk",
    fsReadCallback: () => code,
    withStackComments: true,
    withSrcLineComments: true,
  })
  if (result.status === "error") {
    throw new TolkCompilationError(result.message)
  }

  const codeCell = Cell.fromBase64(result.codeBoc64)

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
    lang: "tolk",
    instructions: initialInstructions,
    code: code,
    assembly: text.print(initialInstructions),
    mapping: debugSectionToInstructions,
  }
}

const recompileCell = (cell: Cell): [Cell, i.Mapping] => {
  const instructionsWithoutPositions = i.decompileCell(cell)
  const assemblyForPositions = text.print(instructionsWithoutPositions)

  const parseResult = text.parse("out.tasm", assemblyForPositions)
  if (parseResult.$ === "ParseFailure") {
    throw new Error("Cannot parse resulting text Assembly")
  }

  return i.compileCellWithMapping(parseResult.instructions)
}
