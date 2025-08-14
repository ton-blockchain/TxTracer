import {useEffect, useMemo, useState} from "react"

import PageHeader from "@shared/ui/PageHeader"
import InstructionTable from "@app/pages/InstructionsPage/components/InstructionTable/InstructionTable.tsx"
import SearchInput from "@shared/ui/SearchInput"
import SearchColumnsSelector, {
  type InstructionColumnKey,
} from "@app/pages/InstructionsPage/components/SearchColumnsSelector"
import SortSelector, {type SortMode} from "@app/pages/InstructionsPage/components/SortSelector"
import CategoryTabs from "@app/pages/InstructionsPage/components/CategoryTabs"
import Button from "@shared/ui/Button"
import tvmSpecData from "@features/spec/gen/tvm-specification.json"
import {POPULARITY} from "@features/spec/popularity/popularity.ts"

import type {TvmSpec} from "@features/spec/tvm-specification.types.ts"

import {
  loadStoredSettings,
  SETTINGS_STORAGE_KEY,
  type StoredSettings,
} from "@app/pages/InstructionsPage/settings.ts"

import styles from "./InstructionsPage.module.css"

function InstructionsPage() {
  const [spec, setSpec] = useState<TvmSpec | null>(null)
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({})

  const stored = loadStoredSettings()

  const [query, setQuery] = useState<string>(stored?.query ?? "")
  const [searchColumns, setSearchColumns] = useState<InstructionColumnKey[]>(
    stored?.searchColumns ?? ["name"],
  )
  const [sortMode, setSortMode] = useState<SortMode>(stored?.sortMode ?? "popularity")
  const [selectedCategory, setSelectedCategory] = useState<string>(stored?.category ?? "All")
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>(
    stored?.subCategory ?? "All",
  )

  useEffect(() => {
    setSpec(tvmSpecData as unknown as TvmSpec)
  }, [])

  const toggleColumn = (key: InstructionColumnKey) => {
    setSearchColumns(prev => (prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]))
  }

  const instructions = useMemo(() => {
    return spec?.instructions ?? ({} as TvmSpec["instructions"])
  }, [spec?.instructions])

  const categories = useMemo(() => {
    const s = new Set<string>()
    for (const [, instr] of Object.entries(instructions)) {
      if (instr?.category) {
        s.add(String(instr.category))
      }
    }
    return Array.from(s).sort((a, b) => a.localeCompare(b))
  }, [instructions])

  const subCategories = useMemo(() => {
    if (selectedCategory === "All") return [] as string[]
    const s = new Set<string>()
    for (const [, instr] of Object.entries(instructions)) {
      if (String(instr.category) === selectedCategory && instr?.subCategory) {
        s.add(String(instr.subCategory))
      }
    }
    return Array.from(s).sort((a, b) => a.localeCompare(b))
  }, [instructions, selectedCategory])

  const filteredByCategory = useMemo(() => {
    let base: typeof instructions = instructions
    if (selectedCategory !== "All") {
      const tmp: typeof instructions = {}
      for (const [name, instr] of Object.entries(instructions)) {
        if (String(instr.category) === selectedCategory) tmp[name] = instr
      }
      base = tmp
    }

    if (selectedSubCategory !== "All") {
      const tmp: typeof instructions = {}
      for (const [name, instr] of Object.entries(base)) {
        if (String(instr.subCategory) === selectedSubCategory) tmp[name] = instr
      }
      return tmp
    }
    return base
  }, [instructions, selectedCategory, selectedSubCategory])

  const filteredInstructions = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return filteredByCategory

    const entries = Object.entries(filteredByCategory)
    const next: typeof filteredByCategory = {}

    for (const [name, instruction] of entries) {
      const haystacks: string[] = []

      if (searchColumns.includes("name")) haystacks.push(name)
      if (searchColumns.includes("opcode")) haystacks.push(instruction.layout.prefix_str)
      if (searchColumns.includes("gas")) {
        // join gas min-max if available via layout/args/effects is complex; use displayed value source in table utils if needed later
        // keep simple: rely on string from calculate function not accessible here; skip heavy compute here
      }
      if (searchColumns.includes("description")) {
        haystacks.push(instruction.description.short ?? "")
        haystacks.push(instruction.description.long ?? "")
        if (instruction.operands && instruction.operands.length > 0)
          haystacks.push(instruction.operands.join(" "))
      }

      const match = haystacks.some(h => h && h.toLowerCase().includes(q))
      if (match) next[name] = instruction
    }
    return next
  }, [query, filteredByCategory, searchColumns])

  const sortedInstructions = useMemo(() => {
    const entries = Object.entries(filteredInstructions)
    if (sortMode === "popularity") {
      // Popularity sort: higher POPULARITY first, fallback by name
      entries.sort((a, b) => {
        const pa = POPULARITY[a[0]] ?? 0
        const pb = POPULARITY[b[0]] ?? 0
        if (pb !== pa) return pb - pa
        return a[0].localeCompare(b[0])
      })
    } else if (sortMode === "category") {
      // Category sort: group by category, then by name
      entries.sort((a, b) => {
        const ca = a[1].category ?? ""
        const cb = b[1].category ?? ""
        if (ca !== cb) return String(ca).localeCompare(String(cb))
        return a[0].localeCompare(b[0])
      })
    } else if (sortMode === "novelty") {
      // Novelty sort: by layout.version desc, then by name
      entries.sort((a, b) => {
        const va = a[1].layout?.version ?? 0
        const vb = b[1].layout?.version ?? 0
        if (vb !== va) return vb - va
        return a[0].localeCompare(b[0])
      })
    } else if (sortMode === "opcode") {
      // Opcode sort: by numeric opcode (prefix), ascending; fallback by name
      entries.sort((a, b) => {
        const pa = Number.parseInt(a[1].layout.prefix_str, 16)
        const pb = Number.parseInt(b[1].layout.prefix_str, 16)
        if (!Number.isNaN(pa) && !Number.isNaN(pb) && pa !== pb) return pa - pb
        // if not hex, compare as string
        if (a[1].layout.prefix_str !== b[1].layout.prefix_str)
          return a[1].layout.prefix_str.localeCompare(b[1].layout.prefix_str)
        return a[0].localeCompare(b[0])
      })
    }
    const out: typeof filteredInstructions = {}
    for (const [k, v] of entries) out[k] = v
    return out
  }, [filteredInstructions, sortMode])

  const [shownLimit, setShownLimit] = useState<number>(100)
  const handleShowMore = () => setShownLimit(prev => prev + 100)

  useEffect(() => {
    const toStore: StoredSettings = {
      query,
      searchColumns,
      sortMode,
      category: selectedCategory,
      subCategory: selectedSubCategory,
      shownLimit,
    }
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(toStore))
    } catch {
      // ignore
    }
  }, [query, searchColumns, sortMode, selectedCategory, selectedSubCategory, shownLimit])

  if (!spec) {
    return <div>Loading specification...</div>
  }

  const handleRowClick = (instructionName: string) => {
    setExpandedRows(prev => ({
      ...prev,
      [instructionName]: !prev[instructionName],
    }))
  }

  return (
    <div className={styles.traceViewWrapper}>
      <PageHeader pageTitle="spec" titleBadgeText="Beta" titleBadgeColor="green">
        <div className={styles.mainActionContainer}></div>
      </PageHeader>

      <main className={styles.appContainer} role="main" aria-label="TVM Instructions">
        <div className={styles.mainContent}>
          <div className={styles.toolbar} role="search" aria-label="Toolbar">
            <SortSelector value={sortMode} onChange={setSortMode} />

            <div className={styles.searchToolbar}>
              <SearchColumnsSelector value={searchColumns} onToggle={toggleColumn} />
              <div className={styles.searchInputContainer}>
                <SearchInput
                  value={query}
                  onChange={setQuery}
                  onSubmit={() => {}}
                  placeholder="Search instructions"
                  compact={true}
                  buttonLabel="Search"
                  autoFocus={true}
                />
              </div>
            </div>
          </div>
          <div>
            <CategoryTabs
              categories={categories}
              selected={selectedCategory}
              onSelect={cat => {
                setSelectedCategory(cat)
                setSelectedSubCategory("All")
              }}
            />
            {subCategories.length > 0 && (
              <CategoryTabs
                categories={subCategories}
                selected={selectedSubCategory}
                onSelect={setSelectedSubCategory}
                label="Subcategory:"
              />
            )}
          </div>
          <InstructionTable
            instructions={sortedInstructions}
            expandedRows={expandedRows}
            onRowClick={handleRowClick}
            groupByCategory={sortMode === "category"}
            limit={shownLimit}
            totalCount={Object.keys(sortedInstructions).length}
            onShowMore={handleShowMore}
            emptyState={
              Object.keys(sortedInstructions).length === 0 ? (
                <div className={styles.noResultsSuggestion} role="status" aria-live="polite">
                  <span>No results</span>
                  {selectedCategory !== "All" && (
                    <Button variant="outline" size="sm" onClick={() => setSelectedCategory("All")}>
                      Search in All
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => setQuery("")}>
                    Reset search
                  </Button>
                </div>
              ) : undefined
            }
          />
        </div>
      </main>
    </div>
  )
}

export default InstructionsPage
