/* eslint-disable */
import type {InstructionSignature} from "./signatures/stack-signatures-schema"

export interface TvmSpec {
  readonly instructions: {[key: string]: Instruction}
}

export interface Instruction {
  readonly category: Category
  readonly description: Description
  readonly layout: Layout
  readonly signature: InstructionSignature
  readonly effects?: Effect[]
  readonly operands?: string[]
}

export enum Category {
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

export interface Description {
  short: string
  long: string
  doc_links?: DocLinks
  tags?: Tag[]
  exit_codes?: Array<{errno: string; condition: string}>
  examples?: Array<{
    instructions: Array<{instruction: string; comment?: string; is_main?: boolean}>
    stack: {input: string[]; output: string[]}
    exit_code?: number
    other_implementations?: {
      exact: boolean
      instructions: string[]
    }[]
  }>
  other_implementations?: {
    exact: boolean
    instructions: string[]
  }[]
  operands: string[]
}

export interface DocLinks {
  "accept_message effects"?: string
  "Low-level fees overview"?: string
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
