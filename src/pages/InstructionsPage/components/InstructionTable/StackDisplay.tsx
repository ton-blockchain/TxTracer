import React from "react"

import type {ConstantValue, StackEntry} from "@features/spec/signatures/stack-signatures-schema.ts"

import styles from "./StackDisplay.module.css"

interface PillProps {
  readonly name?: string
  readonly type: string
  readonly value?: ConstantValue
}

const getPillDisplayProps = (entry: StackEntry): PillProps => {
  switch (entry.type) {
    case "simple":
      return {name: entry.name, type: entry.value_types?.[0] ?? "Any"}
    case "const":
      return {value: entry.value, type: entry.value_type}
    case "array": {
      let repType = "Any"
      const first = entry.array_entry?.[0]
      if (first) {
        if (first.type === "simple") {
          repType = first.value_types?.[0] ?? "Any"
        } else if (first.type === "const") {
          repType = first.value_type ?? "Any"
        }
      }
      return {name: `${entry.name}[] (len: ${entry.length_var})`, type: repType}
    }
    case "conditional":
      return {name: `Conditional: ${entry.name}`, type: "ConditionalBlock"}
    default:
      return {name: "Unknown", type: "Unknown"}
  }
}

export const renderStackItemPill = (item: PillProps, key: string | number) => {
  const itemType = item.type.charAt(0).toUpperCase() + item.type.slice(1).toLowerCase()
  const displayName = item.name ?? (item.value !== undefined ? String(item.value) : "unnamed")
  const typeClass = `stackItem${itemType}`
  const pillStyle = styles[typeClass] ?? styles.stackItemAny
  return (
    <span key={key} className={`${styles.stackItem} ${styles.stackPillVertical} ${pillStyle}`}>
      {displayName}: {item.type}
    </span>
  )
}

interface StackDisplayProps {
  readonly items: ReadonlyArray<StackEntry> | undefined
}

const StackDisplay: React.FC<StackDisplayProps> = ({items}: StackDisplayProps) => {
  if (!items) {
    return <span>&nbsp;</span>
  }

  const reversedItems = [...items].reverse()

  return (
    <div className={styles.stackVerticalListContainer}>
      <span className={styles.stackTopIndicator}>TOP</span>
      {items.length === 0 && <span className={styles.stackEmptyIndicator}>Empty</span>}
      {reversedItems.map((entry, index) => {
        const baseKey = `stackdisp-${index}`
        if (entry.type === "conditional") {
          return (
            <div key={baseKey} className={styles.conditionalBlockVertical}>
              <span className={styles.conditionalNameInTable}>IF</span>
              {entry.match.map((matchArm, matchIdx) => (
                <div
                  key={`${baseKey}-match-${matchIdx}`}
                  className={styles.conditionalBranchVertical}
                >
                  <span className={styles.conditionalLabelInTable}>
                    {entry.name} == {matchArm.value}:
                  </span>
                  {[...matchArm.stack]
                    .reverse()
                    .map((stackEl, stackIdx) =>
                      renderStackItemPill(
                        getPillDisplayProps(stackEl),
                        `${baseKey}-match-${matchIdx}-s-${stackIdx}`,
                      ),
                    )}
                </div>
              ))}
              {entry.else && (
                <div className={styles.conditionalBranchVertical}>
                  <span className={styles.conditionalLabelInTable}>ELSE:</span>
                  {[...entry.else]
                    .reverse()
                    .map((stackEl, stackIdx) =>
                      renderStackItemPill(
                        getPillDisplayProps(stackEl),
                        `${baseKey}-else-s-${stackIdx}`,
                      ),
                    )}
                </div>
              )}
            </div>
          )
        }
        return renderStackItemPill(getPillDisplayProps(entry), baseKey)
      })}
    </div>
  )
}

export default StackDisplay
