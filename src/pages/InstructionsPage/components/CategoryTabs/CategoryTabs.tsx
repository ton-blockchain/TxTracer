import React from "react"

import {prettySubCategoryName} from "../../lib/formatCategory"

import styles from "./CategoryTabs.module.css"

export interface CategoryTabsProps {
  readonly categories: ReadonlyArray<string>
  readonly selected: string
  readonly onSelect: (category: string) => void
  readonly label?: string
}

const CategoryTabs: React.FC<CategoryTabsProps> = ({
  categories,
  selected,
  onSelect,
  label,
}: CategoryTabsProps) => {
  return (
    <div>
      {label && <div className={styles.tabsHeader}>{label}</div>}
      <div className={styles.tabsContainer} role="tablist" aria-label="Filter by category">
        <button
          className={`${styles.tab} ${selected === "All" ? styles.tabActive : ""}`}
          onClick={() => onSelect("All")}
          role="tab"
          aria-selected={selected === "All"}
        >
          All
        </button>
        {categories.map(cat => (
          <button
            key={cat}
            className={`${styles.tab} ${selected === cat ? styles.tabActive : ""}`}
            onClick={() => onSelect(cat)}
            role="tab"
            aria-selected={selected === cat}
          >
            {prettySubCategoryName(cat)}
          </button>
        ))}
      </div>
    </div>
  )
}

export default CategoryTabs
