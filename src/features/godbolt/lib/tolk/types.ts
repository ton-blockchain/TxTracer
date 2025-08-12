import {runtime as i, trace} from "ton-assembly"

export interface TolkCompilationResult {
  readonly lang: "tolk"
  readonly instructions: i.Instr[]
  readonly code: string
  readonly assembly: string
  readonly mapping: Map<number, trace.InstructionInfo[]>
}

export class TolkCompilationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "TolkCompilationError"
  }
}
