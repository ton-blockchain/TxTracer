import React from "react"

import type {
  ConstantValue,
  PossibleValueRange,
  StackEntry,
} from "@features/spec/signatures/stack-signatures-schema.ts"

import {Tooltip} from "@shared/ui/Tooltip"

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

const getPillDisplayProps = (entry: StackEntry): {props: PillProps; range?: PossibleValueRange} => {
  switch (entry.type) {
    case "simple": {
      const baseType = entry.value_types?.[0] ?? "Any"
      const hasNull = entry.value_types?.includes("Null") ?? false
      const type = hasNull ? `${baseType}?` : baseType
      return {
        props: {name: entry.name, type},
        range: entry.range,
      }
    }
    case "const":
      return {props: {value: entry.value, type: entry.value_type}}
    case "array":
      return {props: {name: `${entry.name}[]`, type: "Any"}}
    case "conditional":
      return {props: {name: `Conditional: ${entry.name}`, type: "ConditionalBlock"}}
    default:
      return {props: {name: "Unknown", type: "Unknown"}}
  }
}

function getType(item: PillProps) {
  if (item.type === "Continuation") {
    return "Cont"
  }
  return item.type
}

const renderStackItemPill = (item: PillProps, key: string | number, range?: PossibleValueRange) => {
  const itemType = item.type.endsWith("?") ? item.type.slice(0, -1) : item.type
  const displayName = item.name ?? (item.value !== undefined ? String(item.value) : "unnamed")
  const typeClass = `stackItem${itemType}`
  const pillStyle = styles[typeClass] ?? styles.stackItemAny

  const pillElement = (
    <span className={`${styles.stackItem} ${styles.stackPillVertical} ${pillStyle}`}>
      {displayName}: {getType(item)}
    </span>
  )

  if (range) {
    const tooltipContent = `${displayName}: ${range.min}..=${range.max}`
    return (
      <Tooltip key={key} className={styles.stackPillTooltip} content={tooltipContent}>
        {pillElement}
      </Tooltip>
    )
  }

  return pillElement
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
                    const {props, range} = getPillDisplayProps(stackEl)
                    return renderStackItemPill(props, key, range)
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
                    const {props, range} = getPillDisplayProps(stackEl)
                    return renderStackItemPill(props, key, range)
                  })}
                </div>
              )}
            </div>
          )
        }
        if (entry.type === "array") {
          return <React.Fragment key={baseKey}>{renderArrayPreview(entry, baseKey)}</React.Fragment>
        }
        const {props, range} = getPillDisplayProps(entry)
        return renderStackItemPill(props, baseKey, range)
      })}
    </div>
  )
}

export default StackDisplay
