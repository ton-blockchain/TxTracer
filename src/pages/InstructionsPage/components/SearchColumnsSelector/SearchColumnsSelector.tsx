import React from "react"

import styles from "./SearchColumnsSelector.module.css"

export type InstructionColumnKey = "name" | "opcode" | "description"

interface SearchColumnsSelectorProps {
  readonly value: ReadonlyArray<InstructionColumnKey>
  readonly onToggle: (key: InstructionColumnKey) => void
}

const LABELS: Record<InstructionColumnKey, string> = {
  opcode: "Opcode",
  name: "Name",
  description: "Description",
}

const ORDER: InstructionColumnKey[] = ["opcode", "name", "description"]

const SearchColumnsSelector: React.FC<SearchColumnsSelectorProps> = ({value, onToggle}) => {
  const isSelected = (key: InstructionColumnKey) => value.includes(key)

  return (
    <div className={styles.container}>
      <span>Search in:</span>
      <div className={styles.segmented} role="group" aria-label="Search in columns">
        {ORDER.map((key, index) => (
          <label key={key} className={styles.option}>
            <input
              className={styles.input}
              type="checkbox"
              name={`search-col-${key}`}
              checked={isSelected(key)}
              onChange={() => onToggle(key)}
            />
            <button
              type="button"
              className={`${styles.button} ${isSelected(key) ? styles.buttonSelected : ""} ${
                index === 0
                  ? styles.first
                  : index === ORDER.length - 1
                    ? styles.last
                    : styles.middle
              }`}
              onClick={() => onToggle(key)}
              aria-pressed={isSelected(key)}
            >
              {LABELS[key]}
            </button>
          </label>
        ))}
      </div>
    </div>
  )
}

export default SearchColumnsSelector
