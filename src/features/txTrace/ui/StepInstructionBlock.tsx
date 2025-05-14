import React, {useState, useEffect, useRef} from "react"

import styles from "./StepInstructionBlock.module.css"

export interface InstructionDetail {
  readonly name: string
  readonly gasCost: number
}

interface StepInstructionBlockProps {
  readonly instructions: readonly InstructionDetail[]
  readonly currentIndex: number
  readonly itemHeight?: number
}

export const StepInstructionBlock: React.FC<StepInstructionBlockProps> = ({
  instructions,
  currentIndex,
  itemHeight = 48,
}) => {
  const [transformY, setTransformY] = useState(0)
  const prevIndexRef = useRef(currentIndex)

  useEffect(() => {
    const targetTransformY = -currentIndex * itemHeight
    setTransformY(targetTransformY)
    prevIndexRef.current = currentIndex
  }, [currentIndex, instructions.length, itemHeight])

  if (!instructions || instructions.length === 0) {
    return (
      <div className={styles.stepInstructionContainer} style={{height: `${itemHeight}px`}}>
        <div className={styles.instructionItem} style={{height: `${itemHeight}px`}}>
          No instructions to display.
        </div>
      </div>
    )
  }

  const safeCurrentIndex = Math.max(0, Math.min(instructions.length - 1, currentIndex))

  return (
    <div className={styles.stepInstructionContainer} style={{height: `${itemHeight}px`}}>
      <div
        className={styles.instructionWindow}
        style={{
          transform: `translateY(${transformY}px)`,
          height: `${instructions.length * itemHeight}px`,
        }}
      >
        {instructions.map((instruction, index) => (
          <div
            key={index}
            className={styles.instructionItem}
            style={{height: `${itemHeight}px`}}
            aria-hidden={index !== safeCurrentIndex}
          >
            <span className={styles.instructionName}>{instruction.name}</span>
            {instruction.gasCost.toString().trim() !== "" && (
              <span className={styles.instructionGas}>{instruction.gasCost.toString()} gas</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default React.memo(StepInstructionBlock)
