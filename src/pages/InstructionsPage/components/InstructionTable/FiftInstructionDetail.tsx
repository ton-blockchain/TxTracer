import React from "react"

import type {FiftInstruction, Instruction} from "@features/spec/specification-schema.ts"

import InstructionDetail from "./InstructionDetail"

import styles from "./FiftInstructionDetail.module.css"

interface FiftInstructionDetailProps {
  readonly fiftName: string
  readonly fiftInstruction: FiftInstruction
  readonly actualInstruction: Instruction
}

const FiftInstructionDetail: React.FC<FiftInstructionDetailProps> = ({
  fiftInstruction,
  actualInstruction,
}) => {
  const formatArgumentsString = () => {
    if (!fiftInstruction.arguments || fiftInstruction.arguments.length === 0) {
      return fiftInstruction.actual_name
    }

    let formatted = fiftInstruction.actual_name
    for (const arg of fiftInstruction.arguments) {
      if (typeof arg === "string" && arg.startsWith("$args[")) {
        const argIndex = parseInt(arg.match(/\$args\[(\d+)]/)?.[1] ?? "0", 10)
        const operand = actualInstruction.description.operands?.[argIndex]
        formatted += ` ${operand ?? `{arg${argIndex}}`}`
      } else {
        formatted += ` ${arg}`
      }
    }

    return formatted
  }

  return (
    <div className={styles.fiftDetailContainer}>
      <div className={styles.aliasInfo}>
        <div className={styles.aliasDescription}>
          Fift alias for <strong>{formatArgumentsString()}</strong>
        </div>
      </div>

      <div className={styles.originalInstruction}>
        <InstructionDetail
          instruction={actualInstruction}
          instructionName={fiftInstruction.actual_name}
        />
      </div>
    </div>
  )
}

export default FiftInstructionDetail
