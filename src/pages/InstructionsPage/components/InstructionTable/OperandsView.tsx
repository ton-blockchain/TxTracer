import React from "react"

import {type Arg, type Instruction} from "@features/spec/specification-schema.ts"

import {
  childType,
  type ExtendedArg,
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

const renderChild = (child: ExtendedArg, key: number, operandName?: string) => {
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

const renderArgsTree = (args: Arg[] | undefined, operandNames?: readonly string[]) => {
  if (!args) return null

  const children = args.filter(arg => arg.$ !== "s1" && arg.$ !== "minusOne")

  return (
    <div className={styles.argTree}>
      {children.length > 0 && (
        <ul className={styles.argChildren}>
          {children.map((child, idx) => renderChild(child, idx, operandNames?.[idx]))}
        </ul>
      )}
    </div>
  )
}

export default OperandsView
