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

import {
  loadStoredSettings,
  SETTINGS_STORAGE_KEY,
  type StoredSettings,
} from "@app/pages/InstructionsPage/settings.ts"

import type {
  FiftInstruction,
  Instruction,
  Specification,
} from "@features/spec/specification-schema.ts"

import Footer from "./components/Footer"
import ContinuationsDocsBanner from "./components/ContinuationsDocsBanner/ContinuationsDocsBanner.tsx"

import styles from "./InstructionsPage.module.css"

type ExtendedInstruction = Instruction & {
  readonly isFift?: boolean
  readonly fiftName?: string
  readonly actualInstruction?: Instruction
  readonly fiftInstruction?: FiftInstruction
}

function appendFiftInstructions(to: ExtendedInstruction[], spec: Specification) {
  for (const fiftInstr of spec.fift_instructions) {
    const fiftName = fiftInstr.name
    const actualInstr = spec.instructions.find(i => i.name === fiftInstr.actual_name)
    if (actualInstr) {
      to.push({
        ...actualInstr,
        name: fiftName,
        isFift: true,
        fiftName,
        actualInstruction: actualInstr,
        fiftInstruction: fiftInstr,
        description: {
          ...actualInstr.description,
          short: fiftInstr.description ? "" : actualInstr.description.short,
          long: fiftInstr.description ? fiftInstr.description + "." : actualInstr.description.long,
        },
      })
    }
  }
}

function InstructionsPage() {
  const [spec, setSpec] = useState<Specification | null>(null)
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({})
  const [anchorInstruction, setAnchorInstruction] = useState<string | null>(null)

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
    setSpec(tvmSpecData as unknown as Specification)
  }, [])

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1) // Remove the '#'
      if (hash && hash !== anchorInstruction) {
        setAnchorInstruction(hash)
        setExpandedRows(prev => ({
          ...prev,
          [hash]: true,
        }))
      }
    }

    handleHashChange()
    window.addEventListener("hashchange", handleHashChange)
    return () => window.removeEventListener("hashchange", handleHashChange)
  }, [anchorInstruction])

  const toggleColumn = (key: InstructionColumnKey) => {
    setSearchColumns(prev => (prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]))
  }

  const resetAnchor = () => {
    setAnchorInstruction(null)
    window.history.replaceState(null, "", window.location.pathname)
    setExpandedRows({})
  }

  const instructions: Specification["instructions"] = useMemo(() => {
    return spec?.instructions ?? ({} as Specification["instructions"])
  }, [spec?.instructions])

  const categories = useMemo(() => {
    const s = new Set<string>()
    for (const [, instr] of Object.entries(instructions)) {
      if (instr?.category) {
        s.add(String(instr.category))
      }
    }
    const sorted = Array.from(s).sort((a, b) => a.localeCompare(b))

    sorted.push("Fift-specific")

    return sorted
  }, [instructions])

  const subCategories = useMemo(() => {
    if (selectedCategory === "All") return [] as string[]

    if (selectedCategory === "Fift-specific" && spec) {
      // For Fift, subcategories are the categories of the aliased instructions
      const s = new Set<string>()
      for (const fiftInstr of spec.fift_instructions) {
        const actualInstr = instructions.find(i => i.name === fiftInstr.actual_name)
        if (actualInstr?.category) {
          s.add(String(actualInstr.category))
        }
      }
      return Array.from(s).sort((a, b) => a.localeCompare(b))
    }

    const s = new Set<string>()
    for (const [, instr] of Object.entries(instructions)) {
      if (String(instr.category) === selectedCategory && instr?.sub_category) {
        s.add(String(instr.sub_category))
      }
    }
    return Array.from(s).sort((a, b) => a.localeCompare(b))
  }, [instructions, selectedCategory, spec])

  const filteredByCategory = useMemo(() => {
    let base: ExtendedInstruction[] = []

    if (selectedCategory === "All" && spec) {
      base = [...spec.instructions]
      // Show Fift instructions as well
      appendFiftInstructions(base, spec)
    } else if (selectedCategory === "Fift-specific" && spec) {
      // Show only Fift instructions
      appendFiftInstructions(base, spec)
    } else if (spec) {
      for (const instr of spec.instructions) {
        if (String(instr.category) === selectedCategory) {
          base.push(instr)
        }
      }
    }

    if (selectedSubCategory !== "All") {
      const tmp: ExtendedInstruction[] = []
      for (const instr of base) {
        if (selectedCategory === "Fift-specific") {
          // For Fift instructions, filter by actual instruction category
          const actualCategory = instr.actualInstruction?.category
          if (String(actualCategory) === selectedSubCategory) {
            tmp.push(instr)
          }
        } else {
          if (String(instr.sub_category) === selectedSubCategory) {
            tmp.push(instr)
          }
        }
      }
      return tmp
    }
    return base
  }, [selectedCategory, selectedSubCategory, spec])

  const filteredInstructions: ExtendedInstruction[] = useMemo(() => {
    const q = query.trim().toLowerCase()

    if (anchorInstruction) {
      const allInstructions = spec?.instructions ?? []
      const found = allInstructions.find(i => i.name === anchorInstruction)
      if (found) {
        return [found]
      }

      // Clear anchor if the instruction is not found
      setTimeout(() => {
        setAnchorInstruction(null)
        window.history.replaceState(null, "", window.location.pathname)
        setExpandedRows({})
      }, 0)
      return filteredByCategory
    }

    if (!q) return filteredByCategory

    const next: ExtendedInstruction[] = []

    for (const instruction of filteredByCategory) {
      const haystacks: string[] = []

      if (searchColumns.includes("name")) haystacks.push(instruction.name)
      if (searchColumns.includes("opcode")) haystacks.push(instruction.layout.prefix_str)
      if (searchColumns.includes("description")) {
        haystacks.push(instruction.description.short ?? "")
        haystacks.push(instruction.description.long ?? "")
        if (instruction.description.operands && instruction.description.operands.length > 0)
          haystacks.push(instruction.description.operands.join(" "))
      }

      const match = haystacks.some(h => h && h.toLowerCase().includes(q))
      if (match) {
        next.push(instruction)
      }
    }
    return next
  }, [query, filteredByCategory, searchColumns, anchorInstruction, spec?.instructions])

  const sortedInstructions: ExtendedInstruction[] = useMemo(() => {
    const entries = [...filteredInstructions]
    if (sortMode === "popularity") {
      // Popularity sort: higher POPULARITY first, fallback by name
      entries.sort((a, b) => {
        const pa = POPULARITY[a.name] ?? 0
        const pb = POPULARITY[b.name] ?? 0
        if (pb !== pa) return pb - pa
        return a.name.localeCompare(b.name)
      })
    } else if (sortMode === "category") {
      // Category sort: group by category, then by name
      entries.sort((a, b) => {
        const ca = a.category ?? ""
        const cb = b.category ?? ""
        if (ca !== cb) return String(ca).localeCompare(String(cb))
        return a.name.localeCompare(b.name)
      })
    } else if (sortMode === "novelty") {
      // Novelty sort: by layout.version desc, then by name
      entries.sort((a, b) => {
        const va = a.layout?.version ?? 0
        const vb = b.layout?.version ?? 0
        if (vb !== va) return vb - va
        return a.name.localeCompare(b.name)
      })
    } else if (sortMode === "opcode") {
      // Opcode sort: by numeric opcode (prefix), ascending; fallback by name
      entries.sort((a, b) => {
        const pa = Number.parseInt(a.layout.prefix_str, 16)
        const pb = Number.parseInt(b.layout.prefix_str, 16)
        if (!Number.isNaN(pa) && !Number.isNaN(pb) && pa !== pb) return pa - pb
        // if not hex, compare as string
        if (a.layout.prefix_str !== b.layout.prefix_str)
          return a.layout.prefix_str.localeCompare(b.layout.prefix_str)
        return a.name.localeCompare(b.name)
      })
    }
    const out: ExtendedInstruction[] = []
    for (const v of entries) {
      out.push(v)
    }
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
    // don't allow collapsing the instruction in anchor mode
    if (anchorInstruction) return

    setExpandedRows(prev => ({
      ...prev,
      [instructionName]: !prev[instructionName],
    }))
  }

  return (
    <div className={styles.traceViewWrapper}>
      <PageHeader pageTitle="spec" documentationLink={"/spec/doc/"}>
        <div className={styles.mainActionContainer}></div>
      </PageHeader>

      <main className={styles.appContainer} role="main" aria-label="TVM Instructions">
        <div className={styles.mainContent}>
          {!anchorInstruction && (
            <>
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
                  <div className={styles.subCategoryAndDocsContainer}>
                    <CategoryTabs
                      categories={subCategories}
                      selected={selectedSubCategory}
                      onSelect={setSelectedSubCategory}
                      label="Subcategory:"
                    />
                    {selectedCategory === "continuation" && <ContinuationsDocsBanner />}
                  </div>
                )}
              </div>
            </>
          )}
          {anchorInstruction && (
            <div className={styles.anchorIndicator}>
              <span>Showing: {anchorInstruction}</span>
              <Button variant="outline" size="sm" onClick={resetAnchor}>
                Back to table
              </Button>
            </div>
          )}
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
        <Footer />
      </main>
    </div>
  )
}

export default InstructionsPage
