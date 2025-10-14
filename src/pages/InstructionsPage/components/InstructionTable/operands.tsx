import type {Arg, ArgRange, Args, Child} from "@features/spec/specification-schema.ts"

import styles from "./OperandsView.module.css"

export const renderChildRange = (min?: string, max?: string) => {
  if (!min && !max) return null
  if (min && max) return `${min}..=${max}`
  if (min) return `${min}-?`
  return `?-${max}`
}

export function argType(child?: Arg) {
  if (!child) return ""
  if (child.$ === "uint") return `uint${child.len}`
  if (child.$ === "stack") return `stack register`
  return ""
}

export function childType(child: Child) {
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
    case "hash":
      return `Hash ID`
    case "codeSlice":
      return `Slice with code`
    case "delta":
      return `${argType(child.arg)} + ${child.delta}`
    case "debugstr":
      return "String slice"
    case "dictpush":
      return "Dictionary"
    default:
      return undefined
  }
}

export function getChildByOperandIndex(args: Args | undefined, index: number): Child | undefined {
  if (!args) return undefined
  if (args.$ === "dictpush") {
    return index === 0 ? {$: "dictpush"} : {$: "uint", len: 10}
  }
  if (args.$ === "xchgArgs") {
    return {$: "uint", len: 4, range: {min: "0", max: "15"}}
  }
  const children = args.children?.[0]?.$ === "s1" ? args.children.slice(1) : args.children
  return children?.[index]
}

export const getChildRange = (child: Child): ArgRange | undefined => {
  if (child.range) {
    return child.range
  }
  if (child.$ === "delta") {
    return child.arg?.range
  }
  if (child.$ === "debugstr") {
    return {min: "0", max: "15 bytes"}
  }
  return undefined
}

export function renderArgsTreeCompactForOperand(
  args: Args | undefined,
  operandName: string,
  operandIndex: number,
) {
  const child = getChildByOperandIndex(args, operandIndex)
  if (!child) return operandName
  const type = childType(child)
  const range = child.range ?? child.arg?.range
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
