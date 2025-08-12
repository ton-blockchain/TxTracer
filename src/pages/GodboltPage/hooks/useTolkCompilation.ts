import {useState, useCallback} from "react"
import type * as monaco from "monaco-editor"

import {
  convertTolkErrorsToMarkers,
  parseTolkErrors,
} from "@features/godbolt/lib/tolk/error-parser.ts"
import {TolkCompilationError, type TolkCompilationResult} from "@features/godbolt/lib/tolk/types"

export interface UseTolkCompilationReturn {
  readonly result: TolkCompilationResult | undefined
  readonly compiling: boolean
  readonly error: string
  readonly errorMarkers: monaco.editor.IMarkerData[]
  readonly handleCompile: (code: string) => Promise<void>
  readonly clearError: () => void
  readonly setResult: (result: TolkCompilationResult | undefined) => void
}

export const useTolkCompilation = (): UseTolkCompilationReturn => {
  const [result, setResult] = useState<TolkCompilationResult | undefined>(undefined)
  const [compiling, setCompiling] = useState(false)
  const [error, setError] = useState<string>("")
  const [errorMarkers, setErrorMarkers] = useState<monaco.editor.IMarkerData[]>([])

  const handleCompile = useCallback(async (code: string) => {
    setCompiling(true)
    setError("")
    setErrorMarkers([])

    try {
      const tolk = await import("@features/godbolt/lib/tolk/compilation.ts")
      const compilationResult = await tolk.compileTolkCode(code)
      setResult(compilationResult)
      setErrorMarkers([])
    } catch (compilationError) {
      console.log(compilationError)
      const errorMessage =
        compilationError instanceof Error ? compilationError.message : "Unknown error"

      if (!(compilationError instanceof TolkCompilationError)) {
        setError(errorMessage)
      }

      const parsedErrors = parseTolkErrors(errorMessage)
      const markers = convertTolkErrorsToMarkers(parsedErrors)
      setErrorMarkers(markers)
    } finally {
      setCompiling(false)
    }
  }, [])

  const clearError = useCallback(() => {
    setError("")
    setErrorMarkers([])
  }, [])

  return {
    result,
    compiling,
    error,
    errorMarkers,
    handleCompile,
    clearError,
    setResult,
  }
}
