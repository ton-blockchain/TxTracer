import React from "react"

import {prettyCategoryName} from "../../lib/formatCategory"

import styles from "./CategoryTabs.module.css"

export interface CategoryTabsProps {
  readonly categories: ReadonlyArray<string>
  readonly selected: string
  readonly onSelect: (category: string) => void
}

const CategoryTabs: React.FC<CategoryTabsProps> = ({categories, selected, onSelect}) => {
  return (
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
          {prettyCategoryName(cat)}
        </button>
      ))}
    </div>
  )
}

export default CategoryTabs
