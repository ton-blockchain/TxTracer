import React from "react"

import styles from "./CustomInstructionTooltip.module.css"

interface CustomInstructionTooltipProps {
  text: string
  isVisible: boolean
  position?: {x: number; y: number}
}

export const CustomInstructionTooltip: React.FC<CustomInstructionTooltipProps> = ({
  text,
  isVisible,
  position,
}) => {
  if (!isVisible) {
    return null
  }

  const style: React.CSSProperties = position
    ? {top: `${position.y}px`, left: `${position.x}px`}
    : {}

  return (
    <div className={styles.tooltipContainer} style={style}>
      <pre className={styles.tooltipText}>{text}</pre>
    </div>
  )
}
