import React from "react"

import styles from "@app/pages/InstructionsPage/components/InstructionTable/RegisterSquare.module.css"
import {CONTROL_REGISTERS} from "@features/common/lib/control-registers/control-registers.ts"
import {Tooltip} from "@shared/ui/Tooltip"

export interface RegisterSquareProps {
  readonly index?: number
  readonly variable?: string
}

export const RegisterSquare: React.FC<RegisterSquareProps> = ({index, variable}) => {
  const className =
    index === 0
      ? styles.c0
      : index === 1
        ? styles.c1
        : index === 3
          ? styles.c3
          : index === 7
            ? styles.c7
            : variable === "i"
              ? styles.ci
              : ""

  const crInfo = CONTROL_REGISTERS[`c${index}`]
  const tooltipContent = crInfo ? <p>{crInfo.description}</p> : null

  return (
    <Tooltip content={tooltipContent} variant="hover">
      <div className={styles.registerSquare + " " + className}>
        {index !== undefined && <span className={styles.registerName}>c{index}</span>}
        {variable !== undefined && <span className={styles.registerName}>c({variable})</span>}
      </div>
    </Tooltip>
  )
}
