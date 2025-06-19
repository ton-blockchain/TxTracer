import {Address, Cell, Slice} from "@ton/core"

import type {ParsedObjectByABI} from "@features/sandbox/lib/abi/parser.ts"
import type {ContractData} from "@features/sandbox/lib/contract.ts"
import {CodeBlock, ContractChip} from "@app/pages/SandboxPage/components"

import styles from "./ParsedDataView.module.css"

interface ParsedDataViewProps {
  readonly data: ParsedObjectByABI
  readonly contracts: Map<string, ContractData>
  readonly depth?: number
  readonly maxDepth?: number
}

export function ParsedDataView({data, contracts, depth = 0, maxDepth = 10}: ParsedDataViewProps) {
  if (depth > maxDepth) {
    return <span className={styles.errorText}>Max depth reached</span>
  }

  return (
    <div className={styles.container}>
      {Object.entries(data).map(([key, value]) => (
        <div key={key} className={styles.field}>
          <div className={styles.fieldHeader}>
            <span className={styles.fieldName}>{key}:</span>
          </div>
          <div className={styles.fieldValue}>
            <ParsedValue value={value} contracts={contracts} depth={depth} maxDepth={maxDepth} />
          </div>
        </div>
      ))}
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
