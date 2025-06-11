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
  type FuncCompilationResult,
  loadFuncMapping,
} from "@features/txTrace/lib/funcExecutor.ts"

import {useSourceMapHighlight} from "./useSourceMapHighlight"

import styles from "./GodboltPage.module.css"

const CodeEditor = React.lazy(() => import("@shared/ui/CodeEditor"))

const DEFAULT_FUNC_CODE = `() recv_internal() {

}`

const DEFAULT_SECOND_CODE = `// Second editor content
// You can write additional code here`

const LOCAL_STORAGE_KEY = "txtracer-godbolt-code"
const SECOND_EDITOR_KEY = "txtracer-godbolt-second-code"

function GodboltPage() {
  const [funcCode, setFuncCode] = useState(() => {
    return localStorage.getItem(LOCAL_STORAGE_KEY) ?? DEFAULT_FUNC_CODE
  })
  const [secondCode] = useState(() => {
    return localStorage.getItem(SECOND_EDITOR_KEY) ?? DEFAULT_SECOND_CODE
  })
  const [result, setResult] = useState<FuncCompilationResult | undefined>(undefined)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>("")
  const {setError: setGlobalError} = useGlobalError()

  // Editor refs for auto-scroll functionality
  const funcEditorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
  const asmEditorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)

  // Parse source map from result
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

  // Source map highlighting
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

  // Use filtered assembly code for display when available, otherwise show default
  const displayedAsmCode = result?.assembly
    ? filteredAsmCode || "// Processing assembly..."
    : secondCode

  // Debug logging
  useEffect(() => {
    if (result?.assembly) {
      console.log("Original assembly length:", result.assembly.length)
      console.log("Filtered assembly length:", filteredAsmCode?.length || 0)
      console.log("Has DEBUGMARK in original:", result.assembly.includes("DEBUGMARK"))
      console.log("Has DEBUGMARK in filtered:", filteredAsmCode?.includes("DEBUGMARK") || false)
      console.log(
        "Filtered code preview:",
        filteredAsmCode?.substring(0, 200) || "No filtered code",
      )
      console.log("Displayed code preview:", displayedAsmCode?.substring(0, 200))
      console.log("Has DEBUGMARK in displayed:", displayedAsmCode?.includes("DEBUGMARK"))
    }
  }, [result?.assembly, filteredAsmCode, displayedAsmCode, sourceMap])

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, funcCode)
  }, [funcCode])

  useEffect(() => {
    localStorage.setItem(SECOND_EDITOR_KEY, secondCode)
  }, [secondCode])

  const handleExecute = useCallback(async () => {
    if (!funcCode.trim()) {
      return
    }

    setLoading(true)
    setError("")
    setResult(undefined)

    try {
      const result = await compileFuncCode(funcCode)
      setResult(result)
      console.log(result?.funcSourceMap)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      setError(errorMessage)
      setGlobalError(`Failed to execute assembly code: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }, [funcCode, setGlobalError])

  const handleCodeChange = useCallback((newCode: string) => {
    setFuncCode(newCode)
    setResult(undefined)
    setError("")
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
        <Allotment defaultSizes={[50, 50]} className={styles.editorsContainer}>
          <Allotment.Pane minSize={200}>
            <div className={styles.editorPanel}>
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
                />
              </Suspense>
            </div>
          </Allotment.Pane>

          <Allotment.Pane minSize={200}>
            <div className={styles.editorPanel}>
              <Suspense fallback={<InlineLoader message="Loading Editor..." loading={true} />}>
                <CodeEditor
                  ref={asmEditorRef}
                  code={displayedAsmCode}
                  readOnly={true}
                  language="tasm"
                  highlightGroups={asmHighlightGroups}
                  hoveredLines={asmHoveredLines}
                  onLineHover={handleAsmLineHover}
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
