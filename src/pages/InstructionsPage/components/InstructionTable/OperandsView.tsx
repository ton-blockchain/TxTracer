import React from "react"

import {
  type Arg,
  type Args,
  ArgsEnum,
  type Child,
  type Instruction,
} from "@features/spec/tvm-specification.types"
import {Bits} from "@features/spec/tvm-specification.types"

import styles from "./OperandsView.module.css"

interface OperandsViewProps {
  readonly instruction: Instruction
}

const OperandsView: React.FC<OperandsViewProps> = ({instruction}: OperandsViewProps) => {
  const {description, layout} = instruction
  const operands = instruction.operands ?? description.operands
  if (!operands || operands.length === 0) return null
  return (
    <div className={styles.operandsSection}>
      <h3 className={styles.sectionTitle}>Operands</h3>
      {renderArgsTree(layout.args, operands)}
    </div>
  )
}

const renderRange = (min?: string, max?: string) => {
  if (!min && !max) return null
  if (min && max) return `${min}..=${max}`
  if (min) return `${min}-?`
  return `?-${max}`
}

function argToString(child: Arg | undefined) {
  if (!child) return ""
  switch (child.$) {
    case Bits.Uint:
      return `uint${child.len}`
    case Bits.Stack:
      return `s${child.len}`
  }
}

function typeToString(child: Child) {
  switch (child.$) {
    case "uint":
      return `uint${child.len}`
    case "int":
      return `int${child.len}`
    case "stack":
      return `stack register`
    case "control":
      return `control register`
    case "largeInt":
      return `int257`
    case "refCodeSlice":
    case "inlineCodeSlice":
      return `Inline slice`
    case "codeSlice":
      return `Slice with code`
    case "dictpush":
      return `Dictionary`
    case "delta":
      return argToString(child.arg) + ` + ${child.delta}`
    case "debugstr":
      return "String slice"
    default:
      return undefined
  }
}

const getRange = (child: Child) => {
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

const renderChild = (child: Child, key: string | number, operandName?: string) => {
  const type = typeToString(child)
  const range = getRange(child)

  return (
    <li key={key} className={styles.argNode}>
      <div className={styles.argNameAndType}>
        <div className={styles.argName}>{operandName ?? child.$}</div>
        {type && <div className={styles.argType}>: {type}</div>}
      </div>
      {range && <div className={styles.argValidRange}>({renderRange(range.min, range.max)})</div>}
    </li>
  )
}

const renderArgsTree = (args: Args | undefined, operandNames?: string[]) => {
  if (!args) return null

  if (args.$ === ArgsEnum.Dictpush) {
    const pseudoChildDict: Child = {$: "dictpush"}
    const pseudoChildKeyLength: Child = {
      $: "uint",
      len: 10,
      range: {min: "0", max: (Math.pow(2, 10) - 1).toString()},
    }
    return (
      <div className={styles.argTree}>
        <ul className={styles.argChildren}>{renderChild(pseudoChildDict, 0, operandNames?.[0])}</ul>
        <ul className={styles.argChildren}>
          {renderChild(pseudoChildKeyLength, 1, operandNames?.[1])}
        </ul>
      </div>
    )
  }

  if (args.$ === ArgsEnum.XchgArgs) {
    const pseudoChildI: Child = {
      $: "uint",
      len: 4,
      range: {min: "0", max: (Math.pow(2, 4) - 1).toString()},
    }
    const pseudoChildJ: Child = {
      $: "uint",
      len: 4,
      range: {min: "0", max: (Math.pow(2, 4) - 1).toString()},
    }
    return (
      <div className={styles.argTree}>
        <ul className={styles.argChildren}>{renderChild(pseudoChildI, 0, operandNames?.[0])}</ul>
        <ul className={styles.argChildren}>{renderChild(pseudoChildJ, 1, operandNames?.[1])}</ul>
      </div>
    )
  }

  return (
    <div className={styles.argTree}>
      {args.children && args.children.length > 0 && (
        <ul className={styles.argChildren}>
          {args.children.map((child, idx) => renderChild(child, idx, operandNames?.[idx]))}
        </ul>
      )}
    </div>
  )
}

export default OperandsView
