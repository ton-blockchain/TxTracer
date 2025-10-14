import React from "react"

import {type Child, type Instruction} from "@features/spec/specification-schema.ts"

import {Tooltip} from "@shared/ui/Tooltip/Tooltip"

import styles from "./InlineOperand.module.css"

import {renderArgsTreeCompactForOperand} from "./operands.tsx"

interface InlineOperandProps {
  readonly instructionName: string
  readonly instruction: Instruction
  readonly operandIndex: number
  readonly inDetails: boolean
}

const InlineOperand: React.FC<InlineOperandProps> = ({
  instructionName,
  instruction,
  operandIndex,
  inDetails,
}) => {
  const {description, layout} = instruction
  const operands = description.operands
  if (!operands || operandIndex < 0 || operandIndex >= operands.length) return null
  const name = operands[operandIndex]

  const isType = (op: Child | undefined, type: string) => {
    if (!op) return false
    if (op.$ === type) return true
    if (op.$ === "delta") {
      return type === "stack" && op.arg?.$ === "stack"
    }
    return false
  }

  const layoutChildren = layout.args.children?.[operandIndex]
  const isControl = isType(layoutChildren, "control")
  const isStack =
    layout.args.$ === "xchgArgs" || isType(layoutChildren, "stack") || layoutChildren?.$ === "s1"

  const operandPresentation = isControl ? `c(${name})` : isStack ? `s(${name})` : `[${name}]`

  const tooltip = renderArgsTreeCompactForOperand(layout.args, name, operandIndex)
  const tooltipPlacement = inDetails && instructionName.length < 8 ? "right" : "bottom"

  return (
    <Tooltip content={tooltip} placement={tooltipPlacement}>
      <span className={styles.inlineOperand}>{operandPresentation}</span>
    </Tooltip>
  )
}

export default InlineOperand
