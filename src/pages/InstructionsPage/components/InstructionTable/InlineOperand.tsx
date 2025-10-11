import React from "react"

import {Bits, type Child, type Instruction} from "@features/spec/tvm-specification.types"

import {Tooltip} from "@shared/ui/Tooltip/Tooltip"

import styles from "./InlineOperand.module.css"

import {renderArgsTreeCompactForOperand} from "./operands.tsx"

interface InlineOperandProps {
  readonly instruction: Instruction
  readonly operandIndex: number
}

const InlineOperand: React.FC<InlineOperandProps> = ({instruction, operandIndex}) => {
  const {description, layout} = instruction
  const operands = instruction.operands ?? description.operands
  if (!operands || operandIndex < 0 || operandIndex >= operands.length) return null
  const name = operands[operandIndex]

  const isType = (op: Child | undefined, type: string) => {
    if (!op) return false
    if (op.$ === type) return true
    if (op.$ === "delta") {
      return type === "stack" && op.arg?.$ === Bits.Stack
    }
    return false
  }

  const layoutChildren = layout.args.children?.[operandIndex]
  const isControl = isType(layoutChildren, "control")
  const isStack = isType(layoutChildren, "stack") || layoutChildren?.$ === "s1"

  const operandPresentation = isControl ? `c(${name})` : isStack ? `s(${name})` : `[${name}]`

  const tooltip = renderArgsTreeCompactForOperand(layout.args, name, operandIndex)

  return (
    <Tooltip content={tooltip} placement="bottom">
      <span className={styles.inlineOperand}>{operandPresentation}</span>
    </Tooltip>
  )
}

export default InlineOperand
