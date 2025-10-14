import type {
  FiftInstruction,
  Instruction,
  Specification,
} from "@features/spec/specification-schema.ts"
import tvmSpecData from "@features/spec/gen/tvm-specification.json"

export interface AsmInstruction {
  readonly name: string
  readonly instruction: Instruction
  readonly fiftInstruction?: FiftInstruction
}

export function instructionSpecification(): Specification {
  return tvmSpecData as unknown as Specification
}

export function findInstruction(name: string): AsmInstruction | undefined {
  const data = instructionSpecification()

  const instruction = data?.instructions[name]
  if (instruction) {
    return {name, instruction}
  }

  const fiftInstruction = data?.fift_instructions[name]
  if (fiftInstruction) {
    const instruction = data?.instructions[fiftInstruction.actual_name]
    if (instruction) {
      return {name, instruction, fiftInstruction}
    }
  }

  return undefined
}
