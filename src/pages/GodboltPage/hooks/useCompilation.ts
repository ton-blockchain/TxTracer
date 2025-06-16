import {useState, useCallback} from "react"
import type * as monaco from "monaco-editor"

import {
  compileFuncCode,
  FuncCompilationError,
  type FuncCompilationResult,
} from "@features/godbolt/lib/func/compilation.ts"
import {parseFuncErrors, convertErrorsToMarkers} from "@features/godbolt/lib/func/error-parser.ts"
import {useGlobalError} from "@shared/lib/useGlobalError.tsx"

export interface UseCompilationReturn {
  readonly result: FuncCompilationResult | undefined
  readonly loading: boolean
  readonly error: string
  readonly errorMarkers: monaco.editor.IMarkerData[]
  readonly handleExecuteCode: (code: string) => Promise<void>
  readonly handleExecute: (code: string) => Promise<void>
  readonly clearError: () => void
  readonly setResult: (result: FuncCompilationResult | undefined) => void
}

export const useCompilation = (): UseCompilationReturn => {
  const [result, setResult] = useState<FuncCompilationResult | undefined>(undefined)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>("")
  const [errorMarkers, setErrorMarkers] = useState<monaco.editor.IMarkerData[]>([])

  const {setError: setGlobalError} = useGlobalError()

  const handleExecuteCode = useCallback(
    async (code: string) => {
      setLoading(true)
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
        setLoading(false)
      }
    },
    [setGlobalError],
  )

  const handleExecute = useCallback(
    async (code: string) => {
      await handleExecuteCode(code)
    },
    [handleExecuteCode],
  )

  const clearError = useCallback(() => {
    setError("")
    setErrorMarkers([])
  }, [])

  return {
    result,
    loading,
    error,
    errorMarkers,
    handleExecuteCode,
    handleExecute,
    clearError,
    setResult,
  }
}
