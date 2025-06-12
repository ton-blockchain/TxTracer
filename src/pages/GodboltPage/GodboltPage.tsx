import React, {useState, useCallback, Suspense, useEffect, useMemo, useRef} from "react"

import {FiPlay} from "react-icons/fi"
import {Allotment} from "allotment"
import "allotment/dist/style.css"

import type * as monaco from "monaco-editor"

import InlineLoader from "@shared/ui/InlineLoader"
import ErrorBanner from "@shared/ui/ErrorBanner/ErrorBanner"
import {useGlobalError} from "@shared/lib/errorContext"

import TracePageHeader from "@app/pages/TracePage/TracePageHeader"
import Button from "@shared/ui/Button"
import ButtonLoader from "@shared/ui/ButtonLoader/ButtonLoader.tsx"

import {
  compileFuncCode,
  FuncCompilationError,
  type FuncCompilationResult,
  loadFuncMapping,
} from "@features/txTrace/lib/funcExecutor.ts"

import {parseFuncErrors, convertErrorsToMarkers} from "@features/txTrace/lib/funcErrorParser"

import {useSourceMapHighlight} from "./useSourceMapHighlight"

import styles from "./GodboltPage.module.css"

const CodeEditor = React.lazy(() => import("@shared/ui/CodeEditor"))

const DEFAULT_FUNC_CODE = `() recv_internal() {
    ;; write your code here
}`

const DEFAULT_ASM_CODE = ``

const FUNC_EDITOR_KEY = "txtracer-godbolt-func-code"
const ASM_EDITOR_KEY = "txtracer-godbolt-asm-code"

function GodboltPage() {
  const [funcCode, setFuncCode] = useState(() => {
    return localStorage.getItem(FUNC_EDITOR_KEY) ?? DEFAULT_FUNC_CODE
  })
  const [asmCode] = useState(() => {
    return localStorage.getItem(ASM_EDITOR_KEY) ?? DEFAULT_ASM_CODE
  })
  const [result, setResult] = useState<FuncCompilationResult | undefined>(undefined)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>("")
  const [errorMarkers, setErrorMarkers] = useState<monaco.editor.IMarkerData[]>([])
  const {setError: setGlobalError} = useGlobalError()

  const funcEditorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
  const asmEditorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  const sourceMap = useMemo(() => {
    if (result?.funcSourceMap) {
      try {
        return loadFuncMapping(result.funcSourceMap)
      } catch (e) {
        console.error("Failed to parse source map:", e)
        return undefined
      }
    }
    return undefined
  }, [result?.funcSourceMap])

  const {
    funcHighlightGroups,
    asmHighlightGroups,
    funcHoveredLines,
    asmHoveredLines,
    handleFuncLineHover,
    handleAsmLineHover,
    filteredAsmCode,
  } = useSourceMapHighlight(
    sourceMap,
    result?.mapping,
    funcEditorRef,
    asmEditorRef,
    result?.assembly,
  )

  const displayedAsmCode = result?.assembly ? (filteredAsmCode ?? "") : asmCode

  // Saving editors code
  useEffect(() => {
    localStorage.setItem(FUNC_EDITOR_KEY, funcCode)
  }, [funcCode])
  useEffect(() => {
    localStorage.setItem(ASM_EDITOR_KEY, asmCode)
  }, [asmCode])

  const handleExecuteWithCode = useCallback(
    async (codeToCompile: string) => {
      setLoading(true)
      setError("")
      setErrorMarkers([])

      try {
        const compilationResult = await compileFuncCode(codeToCompile)
        setResult(compilationResult)
        setErrorMarkers([])
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error"

        if (!(error instanceof FuncCompilationError)) {
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

  const handleExecute = useCallback(async () => {
    await handleExecuteWithCode(funcCode)
  }, [funcCode, handleExecuteWithCode])

  const handleCodeChange = useCallback(
    (newCode: string) => {
      setFuncCode(newCode)
      setError("")
      setErrorMarkers([])

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }

      debounceTimerRef.current = setTimeout(() => {
        void handleExecuteWithCode(newCode)
      }, 0)
    },
    [handleExecuteWithCode],
  )

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  const clearError = useCallback(() => {
    setError("")
  }, [])

  return (
    <div className={styles.traceViewWrapper}>
      <TracePageHeader pageTitle="explorer">
        <div className={styles.mainActionContainer}>
          <Button
            onClick={() => void handleExecute()}
            disabled={loading}
            className={styles.executeButton}
            title="Compile"
          >
            {loading ? (
              <ButtonLoader>Compile</ButtonLoader>
            ) : (
              <>
                <FiPlay size={16} />
                Compile
              </>
            )}
          </Button>
        </div>
      </TracePageHeader>

      {error && <ErrorBanner message={error} onClose={clearError} />}

      <div className={styles.appContainer}>
        <Allotment defaultSizes={[50, 50]} className={styles.editorsContainer} separator={false}>
          <Allotment.Pane minSize={200}>
            <div className={styles.editorPanel + " " + styles.editorPanelLeft}>
              <Suspense fallback={<InlineLoader message="Loading Editor..." loading={true} />}>
                <CodeEditor
                  ref={funcEditorRef}
                  code={funcCode}
                  onChange={handleCodeChange}
                  readOnly={false}
                  language="func"
                  highlightGroups={funcHighlightGroups}
                  hoveredLines={funcHoveredLines}
                  onLineHover={handleFuncLineHover}
                  markers={errorMarkers}
                  needBorderRadius={false}
                />
              </Suspense>
            </div>
          </Allotment.Pane>

          <Allotment.Pane minSize={200}>
            <div className={styles.editorPanel + " " + styles.editorPanelRight}>
              <Suspense fallback={<InlineLoader message="Loading Editor..." loading={true} />}>
                <CodeEditor
                  ref={asmEditorRef}
                  code={displayedAsmCode}
                  readOnly={true}
                  language="tasm"
                  highlightGroups={asmHighlightGroups}
                  hoveredLines={asmHoveredLines}
                  onLineHover={handleAsmLineHover}
                  needBorderRadius={false}
                />
              </Suspense>
            </div>
          </Allotment.Pane>
        </Allotment>
      </div>
    </div>
  )
}

export default GodboltPage
