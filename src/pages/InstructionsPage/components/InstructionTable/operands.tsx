import type {Arg, ArgRange} from "@features/spec/specification-schema.ts"

import styles from "./OperandsView.module.css"

export type ExtendedArg = Readonly<Arg | {readonly $: "dictpush"}>

export const renderChildRange = (min?: string, max?: string) => {
  if (!min && !max) return null
  if (min && max) return `${min}..=${max}`
  if (min) return `${min}-?`
  return `?-${max}`
}

export function childType(child: ExtendedArg): string | undefined {
  switch (child.$) {
    case "uint":
      return `uint${child.len}`
    case "int":
      return `int${child.len}`
    case "largeInt":
      return `int257`
    case "stack":
      return `stack register`
    case "control":
      return `control register`
    case "refCodeSlice":
    case "inlineCodeSlice":
      return `Inline slice`
    case "slice":
      return `Slice with data`
    case "codeSlice":
      return `Slice with code`
    case "dict":
      return `Dictionary`
    case "delta":
      return `${childType(child.arg)}`
    case "debugstr":
      return "String slice"
    case "dictpush":
      return "Dictionary"
    default:
      return undefined
  }
}

export function getChildByOperandIndex(
  args: Arg[] | undefined,
  index: number,
): ExtendedArg | undefined {
  if (!args) return undefined
  const children = args[0]?.$ === "s1" ? args.slice(1) : args
  return children?.[index]
}

export const getChildRange = (child: ExtendedArg): ArgRange | undefined => {
  if ("range" in child && child.range) {
    return child.range
  }
  if (child.$ === "delta") {
    return getChildRange(child?.arg)
  }
  if (child.$ === "debugstr") {
    return {min: "0", max: "15 bytes"}
  }
  return undefined
}

export function renderArgsTreeCompactForOperand(
  args: Arg[] | undefined,
  operandName: string,
  operandIndex: number,
) {
  const child = getChildByOperandIndex(args, operandIndex)
  if (!child) return operandName
  const type = childType(child)
  const range = getChildRange(child)
  const rangeStr = renderChildRange(range?.min, range?.max)
  return (
    <div className={styles.argNodeInline}>
      <div className={styles.argNameAndType}>
        <div className={styles.argName}>{operandName}</div>
        {type && <div className={styles.argType}>: {type}</div>}
      </div>
      {rangeStr && <div className={styles.argValidRange}>({rangeStr})</div>}
    </div>
  )
}
