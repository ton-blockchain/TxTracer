/* eslint-disable */
import type {InstructionSignature} from "./signatures/stack-signatures-schema"

export interface TvmSpec {
  readonly instructions: {[key: string]: Instruction}
  readonly fift_instructions: Record<string, FiftInstruction>
}

export type FiftArgument = number | string

export interface FiftInstruction {
  readonly actual_name: string
  readonly arguments: readonly FiftArgument[]
  readonly description?: string
}

export interface Instruction {
  readonly category: Category
  readonly sub_category: SubCategory
  readonly description: Description
  readonly layout: Layout
  readonly signature: InstructionSignature
  readonly effects?: Effect[]
  readonly operands?: string[]
  readonly control_flow?: ControlFlowOfInstruction
  readonly implementation?: ImplementationInfo
}

export interface ImplementationInfo {
  readonly commit_hash: string
  readonly file_path: string
  readonly line_number: number
  readonly function_name: string
}

export interface GasConsumptionEntry {
  readonly value: number
  readonly description: string
}

export enum Category {
  Arithmetic = "arithmetic",
  Cell = "cell",
  Continuation = "continuation",
  Stack = "stack",
}

export enum SubCategory {
  AddMul = "add_mul",
  Address = "address",
  BasicGas = "basic_gas",
  CellCmp = "cell_cmp",
  CellConst = "cell_const",
  CellDeserialize = "cell_deserialize",
  CellSerialize = "cell_serialize",
  Codepage = "codepage",
  Config = "config",
  ContinuationChange = "continuation_change",
  ContinuationCondLoop = "continuation_cond_loop",
  ContinuationDictJump = "continuation_dict_jump",
  ContinuationJump = "continuation_jump",
  Crypto = "crypto",
  Debug = "debug",
  Dictionary = "dictionary",
  Div = "div",
  Exception = "exception",
  IntCmp = "int_cmp",
  IntConst = "int_const",
  Message = "message",
  Misc = "misc",
  OtherArith = "other_arith",
  Prng = "prng",
  ShiftLogic = "shift_logic",
  Stack = "stack",
  Tuple = "tuple",
}

export interface ExitCode {
  readonly errno: string
  readonly condition: string
}

export interface ExampleInstruction {
  readonly instruction: string
  readonly comment?: string
  readonly is_main?: boolean
}

export interface ExampleStack {
  readonly input: readonly string[]
  readonly output: readonly string[]
}

export interface Example {
  readonly instructions: readonly ExampleInstruction[]
  readonly stack: ExampleStack
  readonly exit_code?: number
}

export interface Description {
  readonly short: string
  readonly long: string
  readonly tags?: Tag[]
  readonly exit_codes?: ExitCode[]
  readonly examples?: Example[]
  readonly other_implementations?: {
    readonly exact: boolean
    readonly instructions: string[]
  }[]
  readonly operands: readonly string[]
  readonly gas?: readonly GasConsumptionEntry[]
  readonly docs_links?: readonly DocsLink[]
}

export interface DocsLink {
  readonly name: string
  readonly url: string
}

export enum Tag {
  Address = "address",
  BuilderBuilding = "builder building",
  SliceParsing = "slice parsing",
  VariableSizeInteger = "variable-size integer",
}

export interface Effect {
  $: EffectEnum
  costs: number[]
}

export enum EffectEnum {
  AlwaysThrow = "AlwaysThrow",
  CanThrow = "CanThrow",
  CellCreate = "CellCreate",
  CellLoad = "CellLoad",
  ImplicitJumpRef = "ImplicitJumpRef",
  Tuple = "Tuple",
}

export interface Layout {
  min: number
  max: number
  checkLen: number
  skipLen: number
  args: Args
  exec: string
  kind: Kind
  prefix: number
  prefix_str: string
  version?: number
}

export interface Args {
  $: ArgsEnum
  children?: Child[]
  range?: ArgRange
}

export enum ArgsEnum {
  Dictpush = "dictpush",
  SimpleArgs = "simpleArgs",
  XchgArgs = "xchgArgs",
}

export interface Child {
  $: string
  len?: number
  range?: ArgRange
  delta?: number
  arg?: Arg
  refs?: Refs
  bits?: Arg
  pad?: number
}

export interface Arg {
  $: Bits
  len: number
  range: ArgRange
}

export enum Bits {
  Stack = "stack",
  Uint = "uint",
}

export interface ArgRange {
  min: string
  max: string
}

export interface Refs {
  $: string
  count?: number
  delta?: number
  arg?: Arg
  len?: number
  range?: ArgRange
}

export enum Kind {
  EXT = "ext",
  EXTRange = "ext-range",
  Fixed = "fixed",
  FixedRange = "fixed-range",
  Simple = "simple",
}

/**
 * Information related to current cc modification by instruction
 */
export interface ControlFlowOfInstruction {
  readonly branches: PossibleBranchesOfAnInstruction
  readonly nobranch?: boolean
}

/**
 * Array of current continuation possible values after current instruction execution
 */
export type PossibleBranchesOfAnInstruction = Continuation[]

/**
 * Description of a continuation with static savelist
 */
export type Continuation =
  | {
      readonly type: "cc"
      readonly save?: ContinuationSavelist
    }
  | {
      readonly type: "variable"
      readonly var_name: string
      readonly save?: ContinuationSavelist
    }
  | {
      readonly type: "register"
      readonly index: number
      readonly save?: ContinuationSavelist
    }
  | {
      readonly type: "special"
      readonly name: "until"
      readonly args: {
        readonly body: Continuation
        readonly after: Continuation
      }
    }
  | {
      readonly type: "special"
      readonly name: "while"
      readonly args: {
        readonly cond: Continuation
        readonly body: Continuation
        readonly after: Continuation
      }
    }
  | {
      readonly type: "special"
      readonly name: "again"
      readonly args: {
        readonly body: Continuation
      }
    }
  | {
      readonly type: "special"
      readonly name: "repeat"
      readonly args: {
        readonly count: string
        readonly body: Continuation
        readonly after: Continuation
      }
    }
  | {
      readonly type: "special"
      readonly name: "pushint"
      readonly args: {
        readonly value: number
        readonly next: Continuation
      }
    }

/**
 * Values of saved control flow registers c0-c3
 */
export interface ContinuationSavelist {
  readonly c0?: Continuation
  readonly c1?: Continuation
  readonly c2?: Continuation
  readonly c3?: Continuation
}
