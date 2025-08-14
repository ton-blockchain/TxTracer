import React from "react"

import type {ConstantValue, StackEntry} from "@features/spec/signatures/stack-signatures-schema.ts"

import styles from "./StackDisplay.module.css"

interface PillProps {
  readonly name?: string
  readonly type: string
  readonly value?: ConstantValue
}

const renderTypeOnlyPill = (type: string, key: string | number) => {
  const itemType = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()
  const typeClass = `stackItem${itemType}`
  const pillStyle = styles[typeClass] ?? styles.stackItemAny
  return (
    <span key={key} className={`${styles.stackItem} ${styles.stackPillVertical} ${pillStyle}`}>
      {type}
    </span>
  )
}

const renderArrayPreview = (entry: StackEntry & {readonly type: "array"}, baseKey: string) => {
  let repType = "Any"
  const first = entry.array_entry?.[0]
  if (first) {
    if (first.type === "simple") {
      repType = first.value_types?.[0] ?? "Any"
    } else if (first.type === "const") {
      repType = first.value_type ?? "Any"
    }
  }

  return (
    <>
      <div className={styles.arrayBox}>
        {renderTypeOnlyPill(repType, `${baseKey}-arr-0`)}
        <span
          key={`${baseKey}-arr-ellipsis-in`}
          className={`${styles.stackItem} ${styles.stackPillVertical} ${styles.stackItemAny}`}
        >
          …
        </span>
      </div>
      <div className={styles.arrayMeta}>
        <div className={styles.arrayLengthLabel}>{entry.length_var} elements</div>
      </div>
    </>
  )
}

const getPillDisplayProps = (entry: StackEntry): PillProps => {
  switch (entry.type) {
    case "simple":
      return {name: entry.name, type: entry.value_types?.[0] ?? "Any"}
    case "const":
      return {value: entry.value, type: entry.value_type}
    case "array":
      return {name: `${entry.name}[]`, type: "Any"}
    case "conditional":
      return {name: `Conditional: ${entry.name}`, type: "ConditionalBlock"}
    default:
      return {name: "Unknown", type: "Unknown"}
  }
}

function getType(item: PillProps) {
  if (item.type === "Continuation") {
    return "Cont"
  }
  return item.type
}

export const renderStackItemPill = (item: PillProps, key: string | number) => {
  const itemType = item.type.charAt(0).toUpperCase() + item.type.slice(1).toLowerCase()
  const displayName = item.name ?? (item.value !== undefined ? String(item.value) : "unnamed")
  const typeClass = `stackItem${itemType}`
  const pillStyle = styles[typeClass] ?? styles.stackItemAny
  return (
    <span key={key} className={`${styles.stackItem} ${styles.stackPillVertical} ${pillStyle}`}>
      {displayName}: {getType(item)}
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
                  {[...matchArm.stack].reverse().map((stackEl, stackIdx) => {
                    const key = `${baseKey}-match-${matchIdx}-s-${stackIdx}`
                    if (stackEl.type === "array") {
                      return (
                        <React.Fragment key={key}>
                          {renderArrayPreview(stackEl, key)}
                        </React.Fragment>
                      )
                    }
                    return renderStackItemPill(getPillDisplayProps(stackEl), key)
                  })}
                </div>
              ))}
              {entry.else && (
                <div className={styles.conditionalBranchVertical}>
                  <span className={styles.conditionalLabelInTable}>ELSE:</span>
                  {[...entry.else].reverse().map((stackEl, stackIdx) => {
                    const key = `${baseKey}-else-s-${stackIdx}`
                    if (stackEl.type === "array") {
                      return (
                        <React.Fragment key={key}>
                          {renderArrayPreview(stackEl, key)}
                        </React.Fragment>
                      )
                    }
                    return renderStackItemPill(getPillDisplayProps(stackEl), key)
                  })}
                </div>
              )}
            </div>
          )
        }
        if (entry.type === "array") {
          return <React.Fragment key={baseKey}>{renderArrayPreview(entry, baseKey)}</React.Fragment>
        }
        return renderStackItemPill(getPillDisplayProps(entry), baseKey)
      })}
    </div>
  )
}

export default StackDisplay
