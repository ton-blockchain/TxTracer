import React from "react"

import styles from "./SortSelector.module.css"

export type SortMode = "popularity" | "category" | "novelty"

interface SortSelectorProps {
  readonly value: SortMode
  readonly onChange: (mode: SortMode) => void
}

const LABELS: Record<SortMode, string> = {
  popularity: "Popular",
  category: "Category",
  novelty: "Newest",
}

const ORDER: SortMode[] = ["popularity", "category", "novelty"]

const SortSelector: React.FC<SortSelectorProps> = ({value, onChange}) => {
  return (
    <div className={styles.container}>
      <div className={styles.segmented} role="radiogroup" aria-label="Sort instructions">
        {ORDER.map((key, index) => (
          <label key={key} className={styles.option}>
            <input
              className={styles.input}
              type="radio"
              name="sort-mode"
              value={key}
              checked={value === key}
              onChange={() => onChange(key)}
            />
            <button
              type="button"
              className={`${styles.button} ${value === key ? styles.buttonSelected : ""} ${
                index === 0
                  ? styles.first
                  : index === ORDER.length - 1
                    ? styles.last
                    : styles.middle
              }`}
              onClick={() => onChange(key)}
              aria-pressed={value === key}
            >
              {LABELS[key]}
            </button>
          </label>
        ))}
      </div>
    </div>
  )
}

export default SortSelector
