import React, {useState, useCallback, Suspense, useEffect, useMemo, useRef} from "react"

import {FiPlay, FiShare2, FiCheck, FiSettings} from "react-icons/fi"
import {Allotment} from "allotment"
import "allotment/dist/style.css"

import type * as monaco from "monaco-editor"

import {trace} from "ton-assembly/dist"

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
} from "@features/txTrace/lib/funcExecutor.ts"

import {parseFuncErrors, convertErrorsToMarkers} from "@features/txTrace/lib/funcErrorParser"

import {useSourceMapHighlight} from "./useSourceMapHighlight"
import {decodeCodeFromUrl, encodeCodeToUrl} from "./urlCodeSharing"
import {useGodboltSettings} from "./useGodboltSettings"

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
  const [isCopied, setIsCopied] = useState(false)
  const {setError: setGlobalError} = useGlobalError()

  const funcEditorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
  const asmEditorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

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

  const {
    showVariablesInHover,
    showDocsInHover,
    autoCompile,
    toggleShowVariablesInHover,
    toggleShowDocsInHover,
    toggleAutoCompile,
  } = useGodboltSettings()

  const handleCodeChange = useCallback(
    (newCode: string) => {
      setFuncCode(newCode)
      setError("")
      setErrorMarkers([])

      if (!autoCompile) return

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }

      debounceTimerRef.current = setTimeout(() => {
        void handleExecuteWithCode(newCode)
      }, 0)
    },
    [handleExecuteWithCode, autoCompile],
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

  const handleShareCode = useCallback(async () => {
    const shareUrl = encodeCodeToUrl(funcCode)

    try {
      await navigator.clipboard.writeText(shareUrl)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 1000)
      console.log("Share URL copied to clipboard:", shareUrl)
    } catch (error) {
      console.error("Failed to copy to clipboard:", error)
      const textArea = document.createElement("textarea")
      textArea.value = shareUrl
      document.body.appendChild(textArea)
      textArea.select()
      const success = document.execCommand("copy")
      document.body.removeChild(textArea)

      if (success) {
        setIsCopied(true)
        setTimeout(() => setIsCopied(false), 1000)
      }
    }
  }, [funcCode])

  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const settingsRef = useRef<HTMLDivElement | null>(null)
  const settingsButtonRef = useRef<HTMLButtonElement | null>(null)

  const handleSettingsKeyDown = useCallback((event: React.KeyboardEvent) => {
    switch (event.key) {
      case "Escape": {
        setIsSettingsOpen(false)
        settingsButtonRef.current?.focus()
        break
      }
      case "ArrowDown": {
        event.preventDefault()
        const firstCheckbox: HTMLElement | null | undefined =
          settingsRef.current?.querySelector('input[type="checkbox"]')
        firstCheckbox?.focus()
        break
      }
    }
  }, [])

  const handleSettingsItemKeyDown = useCallback(
    (event: React.KeyboardEvent, action: () => void) => {
      switch (event.key) {
        case "Enter":
        case " ":
          event.preventDefault()
          action()
          break
        case "Escape":
          setIsSettingsOpen(false)
          settingsButtonRef.current?.focus()
          break
      }
    },
    [],
  )

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isSettingsOpen) {
        setIsSettingsOpen(false)
        settingsButtonRef.current?.focus()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isSettingsOpen])

  return (
    <div className={styles.traceViewWrapper}>
      <TracePageHeader pageTitle="explorer">
        <div className={styles.mainActionContainer} role="toolbar" aria-label="Code editor actions">
          <Button
            onClick={() => void handleExecute()}
            disabled={loading}
            className={styles.executeButton}
            title="Compile FunC code to assembly"
            aria-label={loading ? "Compiling code..." : "Compile FunC code"}
            aria-describedby="compile-status"
          >
            {loading ? (
              <ButtonLoader>Compile</ButtonLoader>
            ) : (
              <>
                <FiPlay size={16} aria-hidden="true" />
                Compile
              </>
            )}
          </Button>
          <Button
            onClick={() => void handleShareCode()}
            title={isCopied ? "Link copied!" : "Share code via URL"}
            className={`${styles.shareButton} ${isCopied ? styles.copied : ""}`}
            aria-label={isCopied ? "Code link copied to clipboard" : "Share code via URL"}
            aria-live="polite"
          >
            {isCopied ? (
              <FiCheck size={16} aria-hidden="true" />
            ) : (
              <FiShare2 size={16} aria-hidden="true" />
            )}
            {isCopied ? "Copied!" : "Share"}
          </Button>
          <div className={styles.settingsContainer} ref={settingsRef}>
            <button
              type="button"
              className={styles.settingsButton}
              title="Settings"
              onClick={() => setIsSettingsOpen(prev => !prev)}
              ref={settingsButtonRef}
              onKeyDown={event => handleSettingsKeyDown(event)}
              aria-label="Open settings menu"
              aria-expanded={isSettingsOpen}
              aria-haspopup="menu"
              aria-controls="settings-menu"
            >
              <FiSettings size={16} aria-hidden="true" />
            </button>
            {isSettingsOpen && (
              <div
                className={styles.settingsDropdown}
                role="menu"
                id="settings-menu"
                aria-label="Settings menu"
              >
                <label className={styles.settingsItem} aria-checked={showVariablesInHover}>
                  <input
                    type="checkbox"
                    checked={showVariablesInHover}
                    onChange={toggleShowVariablesInHover}
                    onKeyDown={event =>
                      handleSettingsItemKeyDown(event, toggleShowVariablesInHover)
                    }
                    aria-describedby="vars-hover-desc"
                    tabIndex={0}
                  />
                  <span className={styles.checkboxCustom} aria-hidden="true"></span>
                  <span className={styles.checkboxLabel} id="vars-hover-desc">
                    Show variables on hover
                  </span>
                </label>
                <label className={styles.settingsItem} aria-checked={showDocsInHover}>
                  <input
                    type="checkbox"
                    checked={showDocsInHover}
                    onChange={toggleShowDocsInHover}
                    onKeyDown={event => handleSettingsItemKeyDown(event, toggleShowDocsInHover)}
                    aria-describedby="docs-hover-desc"
                    tabIndex={0}
                  />
                  <span className={styles.checkboxCustom} aria-hidden="true"></span>
                  <span className={styles.checkboxLabel} id="docs-hover-desc">
                    Show instruction docs
                  </span>
                </label>
                <label className={styles.settingsItem} aria-checked={autoCompile}>
                  <input
                    type="checkbox"
                    checked={autoCompile}
                    onChange={toggleAutoCompile}
                    onKeyDown={event => handleSettingsItemKeyDown(event, toggleAutoCompile)}
                    aria-describedby="auto-compile-desc"
                    tabIndex={0}
                  />
                  <span className={styles.checkboxCustom} aria-hidden="true"></span>
                  <span className={styles.checkboxLabel} id="auto-compile-desc">
                    Auto-compile on change
                  </span>
                </label>
              </div>
            )}
          </div>
        </div>
      </TracePageHeader>

      {error && <ErrorBanner message={error} onClose={clearError} />}

      {/* Screen reader status announcements */}
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
