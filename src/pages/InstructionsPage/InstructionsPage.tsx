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

import styles from "./InstructionsPage.module.css"

function InstructionsPage() {
  const [spec, setSpec] = useState<TvmSpec | null>(null)
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({})
  const [query, setQuery] = useState("")
  const [searchColumns, setSearchColumns] = useState<InstructionColumnKey[]>(["name"])
  const [sortMode, setSortMode] = useState<SortMode>("popularity")
  const [selectedCategory, setSelectedCategory] = useState<string>("All")

  useEffect(() => {
    setSpec(tvmSpecData as unknown as TvmSpec)
  }, [])

  const toggleColumn = (key: InstructionColumnKey) => {
    setSearchColumns(prev => (prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]))
  }

  const instructions = spec?.instructions ?? ({} as TvmSpec["instructions"]) // keep ref stable

  const categories = useMemo(() => {
    const s = new Set<string>()
    for (const [, instr] of Object.entries(instructions)) {
      if (instr?.category) s.add(String(instr.category))
    }
    return Array.from(s).sort((a, b) => a.localeCompare(b))
  }, [instructions])

  const filteredByCategory = useMemo(() => {
    if (selectedCategory === "All") return instructions
    const out: typeof instructions = {}
    for (const [name, instr] of Object.entries(instructions)) {
      if (String(instr.category) === selectedCategory) out[name] = instr
    }
    return out
  }, [instructions, selectedCategory])

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
    }
    const out: typeof filteredInstructions = {}
    for (const [k, v] of entries) out[k] = v
    return out
  }, [filteredInstructions, sortMode])

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
      <PageHeader pageTitle="spec">
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
                />
              </div>
            </div>
          </div>
          <CategoryTabs
            categories={categories}
            selected={selectedCategory}
            onSelect={setSelectedCategory}
          />
          <InstructionTable
            instructions={sortedInstructions}
            expandedRows={expandedRows}
            onRowClick={handleRowClick}
            groupByCategory={sortMode === "category"}
            emptyState={
              selectedCategory !== "All" ? (
                <div className={styles.noResultsSuggestion} role="status" aria-live="polite">
                  <span>No results in this category!</span>
                  <Button variant="outline" size="sm" onClick={() => setSelectedCategory("All")}>
                    Search in All
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
