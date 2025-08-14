import {Cell} from "@ton/core"
import {runtime as i, text, trace} from "ton-assembly"
import {type TolkMapping} from "@ton/tolk-js/dist/mapping"
import {runTolkCompiler} from "@ton/tolk-js"

import {TolkCompilationError, type TolkCompilationResult} from "@features/godbolt/lib/tolk/types.ts"
import {createMappingWithCorrectPositions} from "@features/godbolt/lib/common/mapping.ts"

export const compileTolkCode = async (code: string): Promise<TolkCompilationResult | undefined> => {
  const result = await runTolkCompiler({
    entrypointFileName: "main.tolk",
    fsReadCallback: () => code,
    withDebugInfo: true,
    withStackComments: true,
    withSrcLineComments: true,
  })
  if (result.status === "error") {
    throw new TolkCompilationError(result.message)
  }

  const codeCell = Cell.fromBase64(result.codeBoc64)

  const initialInstructions = i.decompileCell(codeCell)
  const [newCell, mapping] = recompileCell(codeCell)

  const newInstructions = i.decompileCell(newCell)
  const newAssembly = text.print(newInstructions)

  const mappingInfo = trace.createMappingInfo(mapping)
  const correctedMappingInfo = createMappingWithCorrectPositions(mappingInfo, newAssembly)

  const allInstructions = [...Object.values(correctedMappingInfo.cells)].flatMap(cell => {
    return cell?.instructions ?? []
  })

  const debugSectionToInstructions = new Map<number, trace.InstructionInfo[]>()

  for (const instr of allInstructions) {
    const arr = debugSectionToInstructions.get(instr.debugSection) ?? []
    arr.push(instr)
    debugSectionToInstructions.set(instr.debugSection, arr)
  }

  return {
    lang: "tolk",
    instructions: initialInstructions,
    code: code,
    assembly: text.print(newInstructions),
    sourceMap: result.debugInfo as TolkMapping,
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
