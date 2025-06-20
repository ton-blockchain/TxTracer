import {Address, Cell, Slice} from "@ton/core"

import type {ParsedObjectByABI} from "@features/sandbox/lib/abi/parser.ts"
import type {ContractData} from "@features/sandbox/lib/contract.ts"
import {CodeBlock, ContractChip} from "@app/pages/SandboxPage/components"

import styles from "./ParsedDataView.module.css"

interface ParsedDataViewProps {
  readonly data: ParsedObjectByABI
  readonly dataBefore?: ParsedObjectByABI
  readonly contracts: Map<string, ContractData>
  readonly depth?: number
  readonly maxDepth?: number
}

export function ParsedDataView({
  data,
  dataBefore,
  contracts,
  depth = 0,
  maxDepth = 10,
}: ParsedDataViewProps) {
  if (depth > maxDepth) {
    return <span className={styles.errorText}>Max depth reached</span>
  }

  const isDiffMode = dataBefore !== undefined

  return (
    <div className={styles.container}>
      {Object.entries(data).map(([key, value]) => {
        const beforeValue = dataBefore?.[key]
        const hasChanged = isDiffMode && !areValuesEqual(beforeValue, value)

        return (
          <div key={key} className={styles.field}>
            <div className={styles.fieldHeader}>
              <span className={styles.fieldName}>{key}:</span>
            </div>
            <div className={styles.fieldValue}>
              {isDiffMode && hasChanged ? (
                <div className={styles.diffValue}>
                  <div className={styles.diffOldValue}>
                    <ParsedValue
                      value={beforeValue}
                      contracts={contracts}
                      depth={depth}
                      maxDepth={maxDepth}
                    />
                  </div>
                  <div className={styles.diffNewValue}>
                    <ParsedValue
                      value={value}
                      contracts={contracts}
                      depth={depth}
                      maxDepth={maxDepth}
                    />
                  </div>
                </div>
              ) : (
                <div className={isDiffMode ? styles.unchanged : undefined}>
                  <ParsedValue
                    value={value}
                    contracts={contracts}
                    depth={depth}
                    maxDepth={maxDepth}
                  />
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

interface ParsedValueProps {
  readonly value: unknown
  readonly contracts: Map<string, ContractData>
  readonly depth: number
  readonly maxDepth: number
}

function ParsedValue({value, contracts, depth, maxDepth}: ParsedValueProps) {
  if (value instanceof Address) {
    return <ContractChip address={value.toString()} contracts={contracts} />
  }

  if (value instanceof Cell) {
    return (
      <div className={styles.cellValue}>
        <CodeBlock title="cell hex" content={value.toBoc().toString("hex")} />
      </div>
    )
  }

  if (value instanceof Slice) {
    return (
      <div className={styles.sliceValue}>
        <CodeBlock title="slice hex" content={value.asCell().toBoc().toString("hex")} />
      </div>
    )
  }

  if (typeof value === "bigint") {
    return <span className={styles.numberValue}>{value.toString()}</span>
  }

  if (typeof value === "number") {
    return <span className={styles.numberValue}>{value.toString()}</span>
  }

  if (typeof value === "boolean") {
    return (
      <span className={value ? styles.booleanTrue : styles.booleanFalse}>
        {value ? "true" : "false"}
      </span>
    )
  }

  if (typeof value === "string") {
    return <span className={styles.stringValue}>&quot;{value}&quot;</span>
  }

  if (value === null || value === undefined) {
    return <span className={styles.nullValue}>null</span>
  }

  if (
    value &&
    typeof value === "object" &&
    "$" in value &&
    value.$ === "sub-object" &&
    "value" in value &&
    value.value
  ) {
    const subObjectData = value.value as ParsedObjectByABI
    return (
      <div className={styles.subObject}>
        <ParsedDataView
          data={subObjectData}
          contracts={contracts}
          depth={depth + 1}
          maxDepth={maxDepth}
        />
      </div>
    )
  }

  if (Array.isArray(value)) {
    return (
      <div className={styles.arrayValue}>
        <div className={styles.arrayLabel}>[{value.length} items]</div>
        {value.map((item, index) => (
          <div key={index} className={styles.arrayItem}>
            <span className={styles.arrayIndex}>[{index}]:</span>
            <div className={styles.arrayItemValue}>
              <ParsedValue
                value={item as unknown}
                contracts={contracts}
                depth={depth + 1}
                maxDepth={maxDepth}
              />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (typeof value === "object" && !Array.isArray(value)) {
    try {
      const objectData = value as ParsedObjectByABI
      return (
        <div className={styles.objectValue}>
          <ParsedDataView
            data={objectData}
            contracts={contracts}
            depth={depth + 1}
            maxDepth={maxDepth}
          />
        </div>
      )
    } catch {
      return <span className={styles.unknownValue}>{JSON.stringify(value)}</span>
    }
  }

  return <span className={styles.unknownValue}>something</span>
}

function areValuesEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true

  if (a instanceof Address && b instanceof Address) {
    return a.toString() === b.toString()
  }

  if (a instanceof Cell && b instanceof Cell) {
    return a.toBoc().toString("hex") === b.toBoc().toString("hex")
  }

  if (a instanceof Slice && b instanceof Slice) {
    return a.asCell().toBoc().toString("hex") === b.asCell().toBoc().toString("hex")
  }

  if (typeof a === "bigint" && typeof b === "bigint") {
    return a === b
  }

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false
    return a.every((item, index) => areValuesEqual(item, b[index]))
  }

  if (typeof a === "object" && typeof b === "object" && a !== null && b !== null) {
    const objA = a as Record<string, unknown>
    const objB = b as Record<string, unknown>
    const keysA = Object.keys(objA)
    const keysB = Object.keys(objB)

    if (keysA.length !== keysB.length) return false

    return keysA.every(key => areValuesEqual(objA[key], objB[key]))
  }

  return false
}
