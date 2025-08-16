import {useCallback, useState} from "react"

export interface PlaygroundSettings {
  readonly showMappingHighlight: boolean
  readonly dimNeverExecutedLines: boolean
}

export interface PlaygroundSettingsHook extends PlaygroundSettings {
  readonly toggleShowMappingHighlight: () => void
  readonly toggleDimNeverExecutedLines: () => void
}

const STORAGE_KEYS = {
  SHOW_MAPPING: "txtracer-playground-show-mapping",
  DIM_NEVER_EXECUTED: "txtracer-playground-dim-never-executed",
} as const

const getStoredBoolean = (key: string, defaultValue: boolean): boolean => {
  const stored = localStorage.getItem(key)
  if (stored === null) return defaultValue
  return stored === "true"
}

const setStoredBoolean = (key: string, value: boolean): void => {
  localStorage.setItem(key, value.toString())
}

export function usePlaygroundSettings(): PlaygroundSettingsHook {
  const [showMappingHighlight, setShowMappingHighlight] = useState<boolean>(() =>
    getStoredBoolean(STORAGE_KEYS.SHOW_MAPPING, false),
  )
  const [dimNeverExecutedLines, setDimNeverExecutedLines] = useState<boolean>(() =>
    getStoredBoolean(STORAGE_KEYS.DIM_NEVER_EXECUTED, true),
  )

  const toggleShowMappingHighlight = useCallback(() => {
    setShowMappingHighlight(prev => {
      const next = !prev
      setStoredBoolean(STORAGE_KEYS.SHOW_MAPPING, next)
      return next
    })
  }, [])

  const toggleDimNeverExecutedLines = useCallback(() => {
    setDimNeverExecutedLines(prev => {
      const next = !prev
      setStoredBoolean(STORAGE_KEYS.DIM_NEVER_EXECUTED, next)
      return next
    })
  }, [])

  return {
    showMappingHighlight,
    dimNeverExecutedLines,
    toggleShowMappingHighlight,
    toggleDimNeverExecutedLines,
  }
}
