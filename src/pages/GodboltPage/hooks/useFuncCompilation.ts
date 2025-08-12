import {useState, useCallback} from "react"
import type * as monaco from "monaco-editor"

import {
  compileFuncCode,
  FuncCompilationError,
  type FuncCompilationResult,
} from "@features/godbolt/lib/func/compilation.ts"
import {parseFuncErrors, convertErrorsToMarkers} from "@features/godbolt/lib/func/error-parser.ts"
import {useGlobalError} from "@shared/lib/useGlobalError.tsx"

export interface UseFuncCompilationReturn {
  readonly result: FuncCompilationResult | undefined
  readonly compiling: boolean
  readonly error: string
  readonly errorMarkers: monaco.editor.IMarkerData[]
  readonly handleCompile: (code: string) => Promise<void>
  readonly clearError: () => void
  readonly setResult: (result: FuncCompilationResult | undefined) => void
}

export const useFuncCompilation = (): UseFuncCompilationReturn => {
  const [result, setResult] = useState<FuncCompilationResult | undefined>(undefined)
  const [compiling, setCompiling] = useState(false)
  const [error, setError] = useState<string>("")
  const [errorMarkers, setErrorMarkers] = useState<monaco.editor.IMarkerData[]>([])

  const {setError: setGlobalError} = useGlobalError()

  const handleCompile = useCallback(
    async (code: string) => {
      setCompiling(true)
      setError("")
      setErrorMarkers([])

      try {
        const compilationResult = await compileFuncCode(code)
        setResult(compilationResult)
        setErrorMarkers([])
      } catch (compilationError) {
        const errorMessage =
          compilationError instanceof Error ? compilationError.message : "Unknown error"

        if (!(compilationError instanceof FuncCompilationError)) {
          setError(errorMessage)
          setGlobalError(`Failed to compile FunC code: ${errorMessage}`)
        }

        const parsedErrors = parseFuncErrors(errorMessage)
        const markers = convertErrorsToMarkers(parsedErrors)
        setErrorMarkers(markers)
      } finally {
        setCompiling(false)
      }
    },
    [setGlobalError],
  )

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
