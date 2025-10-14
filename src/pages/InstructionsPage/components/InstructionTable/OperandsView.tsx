import React from "react"

import {type Args, type Child, type Instruction} from "@features/spec/specification-schema.ts"

import {
  childType,
  getChildRange,
  renderChildRange,
} from "@app/pages/InstructionsPage/components/InstructionTable/operands.tsx"

import styles from "./OperandsView.module.css"

interface OperandsViewProps {
  readonly instruction: Instruction
}

const OperandsView: React.FC<OperandsViewProps> = ({instruction}: OperandsViewProps) => {
  const {description, layout} = instruction
  const operands = description.operands
  if (!operands || operands.length === 0) return null
  return (
    <div className={styles.operandsSection}>
      <h3 className={styles.sectionTitle}>Operands</h3>
      {renderArgsTree(layout.args, operands)}
    </div>
  )
}

const renderChild = (child: Child, key: string | number, operandName?: string) => {
  const type = childType(child)
  const range = getChildRange(child)

  return (
    <li key={key} className={styles.argNode}>
      <div className={styles.argNameAndType}>
        <div className={styles.argName}>{operandName ?? child.$}</div>
        {type && <div className={styles.argType}>: {type}</div>}
      </div>
      {range && (
        <div className={styles.argValidRange}>({renderChildRange(range.min, range.max)})</div>
      )}
    </li>
  )
}

const renderArgsTree = (args: Args | undefined, operandNames?: readonly string[]) => {
  if (!args) return null
  if (args.$ === "dictpush") {
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

  if (args.$ === "xchgArgs") {
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

  const children = args.children?.[0]?.$ === "s1" ? args.children.slice(1) : args.children

  return (
    <div className={styles.argTree}>
      {children && children.length > 0 && (
        <ul className={styles.argChildren}>
          {children.map((child, idx) => renderChild(child, idx, operandNames?.[idx]))}
        </ul>
      )}
    </div>
  )
}

export default OperandsView
