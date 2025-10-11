import React from "react"

import type {Instruction} from "@features/spec/tvm-specification.types"

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

  const layoutChildren = layout.args.children?.[operandIndex]
  const isControl = layoutChildren?.$ === "control"
  const isStack = layoutChildren?.$ === "stack" || layoutChildren?.$ === "s1"

  const operandPresentation = isControl ? `c(${name})` : isStack ? `s(${name})` : `[${name}]`

  const tooltip = renderArgsTreeCompactForOperand(layout.args, name, operandIndex)

  return (
    <Tooltip content={tooltip} placement="bottom">
      <span className={styles.inlineOperand}>{operandPresentation}</span>
    </Tooltip>
  )
}

export default InlineOperand
