import {runtime as i, text, trace} from "ton-assembly"

export const createMappingWithCorrectPositions = (
  originalMapping: trace.MappingInfo,
  newAssembly: string,
): trace.MappingInfo => {
  const parseResult = text.parse("out.tasm", newAssembly)
  if (parseResult.$ === "ParseFailure") {
    throw new Error("Cannot parse resulting text Assembly")
  }

  const instructionsWithPosition = parseResult.instructions
  const [, mappingWithCorrectPositions] = i.compileCellWithMapping(instructionsWithPosition)
  const mappingInfoWithPositions = trace.createMappingInfo(mappingWithCorrectPositions)

  const newCells: trace.CellsMapping = {}

  Object.entries(originalMapping.cells).forEach(([hash, cell]) => {
    if (!cell) {
      newCells[hash] = cell
      return
    }

    const matchingCell = mappingInfoWithPositions.cells[hash]
    if (!matchingCell) {
      newCells[hash] = cell
      return
    }

    const newInstructions: trace.InstructionInfo[] = []

    for (const instruction of cell.instructions) {
      const matchingInstr = matchingCell.instructions?.find(it => it.offset === instruction.offset)

      if (matchingInstr?.loc) {
        newInstructions.push({
          ...instruction,
          loc: matchingInstr.loc,
        })
      } else {
        newInstructions.push(instruction)
      }
    }

    newCells[hash] = {
      ...cell,
      instructions: newInstructions,
    }
  })

  return {
    ...originalMapping,
    cells: newCells,
  }
}
