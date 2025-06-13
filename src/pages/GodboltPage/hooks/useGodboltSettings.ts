import {useState, useCallback} from "react"

export interface GodboltSettings {
  readonly showVariablesInHover: boolean
  readonly showDocsInHover: boolean
  readonly autoCompile: boolean
}

export interface GodboltSettingsHook extends GodboltSettings {
  readonly toggleShowVariablesInHover: () => void
  readonly toggleShowDocsInHover: () => void
  readonly toggleAutoCompile: () => void
}

const STORAGE_KEYS = {
  SHOW_VARS_HOVER: "txtracer-code-explorer-show-vars-hover",
  SHOW_DOCS_HOVER: "txtracer-code-explorer-show-docs-hover",
  AUTO_COMPILE: "txtracer-code-explorer-auto-compile",
} as const

const getStoredBoolean = (key: string, defaultValue: boolean): boolean => {
  const stored = localStorage.getItem(key)
  if (stored === null) return defaultValue
  return stored === "true"
}

const setStoredBoolean = (key: string, value: boolean): void => {
  localStorage.setItem(key, value.toString())
}

export const useGodboltSettings = (): GodboltSettingsHook => {
  const [showVariablesInHover, setShowVariablesInHover] = useState(() =>
    getStoredBoolean(STORAGE_KEYS.SHOW_VARS_HOVER, false),
  )

  const [showDocsInHover, setShowDocsInHover] = useState(() =>
    getStoredBoolean(STORAGE_KEYS.SHOW_DOCS_HOVER, false),
  )

  const [autoCompile, setAutoCompile] = useState(() =>
    getStoredBoolean(STORAGE_KEYS.AUTO_COMPILE, true),
  )

  const toggleShowVariablesInHover = useCallback(() => {
    setShowVariablesInHover(prev => {
      const newVal = !prev
      setStoredBoolean(STORAGE_KEYS.SHOW_VARS_HOVER, newVal)
      return newVal
    })
  }, [])

  const toggleShowDocsInHover = useCallback(() => {
    setShowDocsInHover(prev => {
      const newVal = !prev
      setStoredBoolean(STORAGE_KEYS.SHOW_DOCS_HOVER, newVal)
      return newVal
    })
  }, [])

  const toggleAutoCompile = useCallback(() => {
    setAutoCompile(prev => {
      const newVal = !prev
      setStoredBoolean(STORAGE_KEYS.AUTO_COMPILE, newVal)
      return newVal
    })
  }, [])

  return {
    showVariablesInHover,
    showDocsInHover,
    autoCompile,
    toggleShowVariablesInHover,
    toggleShowDocsInHover,
    toggleAutoCompile,
  }
}
