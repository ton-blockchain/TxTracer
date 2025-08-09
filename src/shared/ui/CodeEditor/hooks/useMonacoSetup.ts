import {useEffect, useState} from "react"
import {useMonaco} from "@monaco-editor/react"
import type * as monacoTypes from "monaco-editor"

import {useTheme} from "@shared/lib/useTheme"

import {asmData} from "@features/tasm/lib"

import {DARK_THEME, LIGHT_THEME} from "../themes"
import {funcLanguageDefinition} from "../languages/FuncLanguageDefinition"
import {tasmLanguageDefinition} from "../languages/TasmLanguageDefinition"
import {FUNC_LANGUAGE_ID, TASM_LANGUAGE_ID} from "../languages"

export type SupportedLanguage = "tasm" | "func"

interface UseMonacoSetupOptions {
  readonly language: SupportedLanguage
}

interface UseMonacoSetupReturn {
  readonly monaco: typeof monacoTypes | null
  readonly isReady: boolean
  readonly isMac: boolean
}

const initializeMonaco = (monaco: typeof monacoTypes, language: SupportedLanguage) => {
  if (language === "tasm") {
    monaco.languages.register({id: TASM_LANGUAGE_ID})
    monaco.languages.setMonarchTokensProvider(TASM_LANGUAGE_ID, tasmLanguageDefinition)
  }

  if (language === "func") {
    monaco.languages.register({id: FUNC_LANGUAGE_ID})
    monaco.languages.setMonarchTokensProvider(FUNC_LANGUAGE_ID, funcLanguageDefinition)
  }

  monaco.editor.defineTheme("light-theme", LIGHT_THEME)
  monaco.editor.defineTheme("dark-theme", DARK_THEME)
}

export const useMonacoSetup = ({language}: UseMonacoSetupOptions): UseMonacoSetupReturn => {
  const monaco = useMonaco()
  const {theme} = useTheme()
  const [isReady, setIsReady] = useState(false)
  const [isMac, setIsMac] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined" && typeof navigator !== "undefined") {
      setIsMac(navigator.platform.toUpperCase().indexOf("MAC") >= 0)
    }
  }, [])

  useEffect(() => {
    if (!monaco) return

    try {
      initializeMonaco(monaco, language)
      setIsReady(true)
    } catch (error) {
      console.error("Failed to initialize Monaco:", error)
    }
  }, [monaco, language])

  useEffect(() => {
    if (!monaco || !isReady) return

    try {
      monaco.editor.setTheme(theme === "dark" ? "dark-theme" : "light-theme")
    } catch (error) {
      console.error("Failed to set theme:", error)
    }
  }, [theme, monaco, isReady])

  // Preload assembly data for TASM
  useEffect(() => {
    if (isReady && language === "tasm") {
      try {
        asmData()
      } catch (error) {
        console.warn("Failed to preload assembly data:", error)
      }
    }
  }, [isReady, language])

  return {
    monaco,
    isReady,
    isMac,
  }
}
