import {runtime as i} from "ton-assembly"
import type {InstructionInfo} from "ton-source-map"

export interface TolkCompilationResult {
  readonly lang: "tolk"
  readonly instructions: i.Instr[]
  readonly code: string
  readonly assembly: string
  readonly mapping: Map<number, InstructionInfo[]>
}

export class TolkCompilationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "TolkCompilationError"
  }
}
