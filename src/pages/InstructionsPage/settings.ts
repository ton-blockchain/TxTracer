import type {InstructionColumnKey} from "@app/pages/InstructionsPage/components/SearchColumnsSelector"
import type {SortMode} from "@app/pages/InstructionsPage/components/SortSelector"

export const SETTINGS_STORAGE_KEY = "tvm-specification-settings"

export interface StoredSettings {
  readonly query: string
  readonly searchColumns: InstructionColumnKey[]
  readonly sortMode: SortMode
  readonly category: string
  readonly subCategory: string
  readonly shownLimit: number
}

export const loadStoredSettings = (): StoredSettings | null => {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as Partial<StoredSettings>
    if (!data || typeof data !== "object") return null
    return {
      query: typeof data.query === "string" ? data.query : "",
      searchColumns: Array.isArray(data.searchColumns)
        ? data.searchColumns.filter(Boolean)
        : ["name"],
      sortMode:
        data.sortMode === "popularity" ||
        data.sortMode === "category" ||
        data.sortMode === "novelty" ||
        data.sortMode === "opcode"
          ? data.sortMode
          : "popularity",
      category: typeof data.category === "string" ? data.category : "All",
      subCategory: typeof data.subCategory === "string" ? data.subCategory : "All",
      shownLimit:
        typeof data.shownLimit === "number" && data.shownLimit > 0 ? data.shownLimit : 100,
    }
  } catch {
    return null
  }
}
