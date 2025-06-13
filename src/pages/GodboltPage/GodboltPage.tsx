import React, {useState, useCallback, Suspense, useEffect, useMemo, useRef} from "react"

import {Allotment} from "allotment"
import "allotment/dist/style.css"

import type * as monaco from "monaco-editor"

import {trace} from "ton-assembly/dist"

import InlineLoader from "@shared/ui/InlineLoader"
import ErrorBanner from "@shared/ui/ErrorBanner/ErrorBanner"
import {useGlobalError} from "@shared/lib/errorContext"

import TracePageHeader from "@app/pages/TracePage/TracePageHeader"

import {
  compileFuncCode,
  FuncCompilationError,
  type FuncCompilationResult,
} from "@features/txTrace/lib/funcExecutor.ts"

import {parseFuncErrors, convertErrorsToMarkers} from "@features/txTrace/lib/funcErrorParser"

import {CompileButton, SettingsDropdown, ShareButton} from "@app/pages/GodboltPage/components"

import {useSourceMapHighlight} from "./hooks/useSourceMapHighlight"
import {useGodboltSettings} from "./hooks/useGodboltSettings"
import {decodeCodeFromUrl} from "./urlCodeSharing"

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
    const sharedCode = decodeCodeFromUrl()
    if (sharedCode) {
      return sharedCode
    }
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

  const sourceMap = useMemo(() => {
    if (result?.funcSourceMap) {
      try {
        return trace.loadFuncMapping(result.funcSourceMap)
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
    funcPreciseHighlightRanges,
    handleFuncLineHover,
    handleAsmLineHover,
    filteredAsmCode,
    getVariablesForAsmLine,
  } = useSourceMapHighlight(
    sourceMap,
    result?.mapping,
    funcEditorRef,
    asmEditorRef,
    result?.assembly,
  )

  const displayedAsmCode = result?.assembly ? (filteredAsmCode ?? "") : asmCode

  useEffect(() => {
    localStorage.setItem(FUNC_EDITOR_KEY, funcCode)
  }, [funcCode])
  useEffect(() => {
    localStorage.setItem(ASM_EDITOR_KEY, asmCode)
  }, [asmCode])

  const handleExecuteCode = useCallback(
    async (code: string) => {
      setLoading(true)
      setError("")
      setErrorMarkers([])

      try {
        const compilationResult = await compileFuncCode(code)
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
    await handleExecuteCode(funcCode)
  }, [funcCode, handleExecuteCode])

  const godboltSettingsHook = useGodboltSettings()
  const {showVariablesInHover, showDocsInHover, autoCompile} = godboltSettingsHook

  const handleCodeChange = useCallback(
    (newCode: string) => {
      setFuncCode(newCode)
      setError("")
      setErrorMarkers([])

      if (!autoCompile) {
        // reset results since code changed
        setResult(undefined)
        return
      }

      void handleExecuteCode(newCode)
    },
    [handleExecuteCode, autoCompile],
  )

  const clearError = useCallback(() => {
    setError("")
  }, [])

  return (
    <div className={styles.traceViewWrapper}>
      <TracePageHeader pageTitle="explorer">
        <div className={styles.mainActionContainer} role="toolbar" aria-label="Code editor actions">
          <CompileButton
            onCompile={() => void handleExecute()}
            loading={loading}
            className={styles.executeButton}
          />
          <ShareButton value={funcCode} />
          <SettingsDropdown hooks={godboltSettingsHook} />
        </div>
      </TracePageHeader>

      {error && <ErrorBanner message={error} onClose={clearError} />}

      <div id="compile-status" className="sr-only" aria-live="polite" aria-atomic="true">
        {loading && "Compiling code..."}
        {result && !loading && "Code compiled successfully"}
        {error && !loading && `Compilation failed: ${error}`}
      </div>

      <main className={styles.appContainer} role="main" aria-label="Code editor workspace">
        <Allotment defaultSizes={[50, 50]} className={styles.editorsContainer} separator={false}>
          <Allotment.Pane minSize={200}>
            <div
              className={styles.editorPanel + " " + styles.editorPanelLeft}
              aria-label="FunC code editor"
              role="region"
            >
              <h2 className="sr-only">FunC Source Code</h2>
              <Suspense fallback={<InlineLoader message="Loading Editor..." loading={true} />}>
                <CodeEditor
                  ref={funcEditorRef}
                  code={funcCode}
                  onChange={handleCodeChange}
                  readOnly={false}
                  language="func"
                  highlightGroups={funcHighlightGroups}
                  hoveredLines={funcHoveredLines}
                  highlightRanges={funcPreciseHighlightRanges}
                  onLineHover={handleFuncLineHover}
                  markers={errorMarkers}
                  needBorderRadius={false}
                />
              </Suspense>
            </div>
          </Allotment.Pane>

          <Allotment.Pane minSize={200}>
            <div
              className={styles.editorPanel + " " + styles.editorPanelRight}
              aria-label="Assembly output"
              role="region"
            >
              <h2 className="sr-only">Generated Assembly Code</h2>
              <Suspense fallback={<InlineLoader message="Loading Editor..." loading={true} />}>
                <CodeEditor
                  ref={asmEditorRef}
                  code={displayedAsmCode}
                  readOnly={true}
                  language="tasm"
                  highlightGroups={asmHighlightGroups}
                  hoveredLines={asmHoveredLines}
                  onLineHover={handleAsmLineHover}
                  getVariablesForLine={showVariablesInHover ? getVariablesForAsmLine : undefined}
                  showInstructionDocs={showDocsInHover}
                  needBorderRadius={false}
                />
              </Suspense>
            </div>
          </Allotment.Pane>
        </Allotment>
      </main>
    </div>
  )
}

export default GodboltPage
