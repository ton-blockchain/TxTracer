/**
 * Allowed chars are `a-zA-Z0-9_`, must not begin with digit or underscore and must not end with underscore.
 */
export type VariableName = string

export type PossibleValueRange = {
  readonly min: number
  readonly max: number
}
/**
 * Representation of stack entry or group of stack entries
 */
export type StackEntry =
  | {
      readonly type: "simple"
      readonly name: VariableName
      readonly range?: PossibleValueRange
      readonly presentation?: string
      readonly value_types?: PossibleValueTypes
      readonly mutations?: Mutation[]
    }
  | {
      readonly type: "const"
      readonly value_type: ConstantType
      readonly value: ConstantValue
    }
  | {
      readonly type: "conditional"
      readonly name: VariableName1
      readonly match: MatchArm[]
      readonly else?: StackValues
    }
  | {
      readonly type: "array"
      readonly name: VariableName
      readonly length_var: VariableName2
      readonly array_entry: ArraySingleEntryDefinition
    }
export type PossibleValueTypes = readonly (
  | "Int"
  | "Bool"
  | "Cell"
  | "Builder"
  | "Slice"
  | "Tuple"
  | "Continuation"
  | "Null"
)[]
export type ConstantType = "Int" | "Null"
export type ConstantValue = number | null | "NaN"
/**
 * Allowed chars are `a-zA-Z0-9_`, must not begin with digit or underscore and must not end with underscore.
 */
export type VariableName1 = string
export type ArmValue = number
/**
 * Allowed chars are `a-zA-Z0-9_`, must not begin with digit or underscore and must not end with underscore.
 */
export type VariableName2 = string
/**
 * Array is a structure like `x1 y1 z1 x2 y2 z2 ... x_n y_n z_n n` which contains `n` entries of `x_i y_i z_i`. This property defines the structure of a single entry.
 */
export type ArraySingleEntryDefinition = StackValues
/**
 * Stack constraints. Top of stack is the last value.
 */
export type StackValues = readonly StackEntry[]
/**
 * Represents read/write access to a register
 */
export type Register =
  | {
      readonly type: "constant"
      readonly index: number
    }
  | {
      readonly type: "variable"
      readonly var_name: VariableName
    }
  | {
      readonly type: "special"
      readonly name: "gas" | "cstate" | "r"
    }
export type RegisterValues = readonly Register[]
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
      readonly var_name: VariableName3
      readonly save?: ContinuationSavelist
    }
  | {
      readonly type: "register"
      readonly index: RegisterNumber03
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
        readonly count: VariableName4
        readonly body: Continuation
        readonly after: Continuation
      }
    }
  | {
      readonly type: "special"
      readonly name: "pushint"
      readonly args: {
        readonly value: IntegerToPushToStack
        readonly next: Continuation
      }
    }
/**
 * Allowed chars are `a-zA-Z0-9_`, must not begin with digit or underscore and must not end with underscore.
 */
export type VariableName3 = string
export type RegisterNumber03 = number
/**
 * Allowed chars are `a-zA-Z0-9_`, must not begin with digit or underscore and must not end with underscore.
 */
export type VariableName4 = string
export type IntegerToPushToStack = number

export type Mutation = {
  readonly length: {
    readonly amount_arg?: number
    readonly stack_amount_arg?: number
  }
}

export type Schema = Record<string, InstructionSignature>

/**
 * Information related to usage of stack and registers by instruction.
 */
export interface InstructionSignature {
  readonly stack_string?: string
  readonly inputs?: InstructionInputs
  readonly outputs?: InstructionOutputs
}

/**
 * Incoming values constraints.
 */
export interface InstructionInputs {
  readonly stack?: StackValues
  readonly registers?: RegisterValues
}

export interface MatchArm {
  readonly value: ArmValue
  readonly stack: StackValues
}

/**
 * Outgoing values constraints.
 */
export interface InstructionOutputs {
  readonly stack?: StackValues
  readonly registers?: RegisterValues
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
