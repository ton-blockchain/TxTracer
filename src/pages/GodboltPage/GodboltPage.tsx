import React, {Suspense, useCallback, useEffect, useMemo, useRef, useState} from "react"

import {Allotment} from "allotment"
import "allotment/dist/style.css"

import type * as monaco from "monaco-editor"

import {trace} from "ton-assembly-test-dev/dist"

import InlineLoader from "@shared/ui/InlineLoader"
import ErrorBanner from "@shared/ui/ErrorBanner/ErrorBanner"
import PageHeader from "@shared/ui/PageHeader"
import Tutorial, {useTutorial} from "@shared/ui/Tutorial"

import {CompileButton, SettingsDropdown} from "@app/pages/GodboltPage/components"

import {useSourceMapHighlight} from "@app/pages/GodboltPage/hooks"

import ShareButton from "@shared/ui/ShareButton/ShareButton.tsx"

import {TUTORIAL_STEPS} from "@app/pages/GodboltPage/Tutorial.ts"

import {useGodboltSettings} from "./hooks/useGodboltSettings"
import {useCompilation} from "./hooks/useCompilation"
import {decodeCodeFromUrl} from "./urlCodeSharing"

import styles from "./GodboltPage.module.css"

const CodeEditor = React.lazy(() => import("@shared/ui/CodeEditor"))

const DEFAULT_FUNC_CODE = `#include "stdlib.fc";

() recv_internal(int msg_value, cell in_msg_cell, slice in_msg) {
    var cs = in_msg_cell.begin_parse();
    var flags = cs~load_uint(4);  ;; int_msg_info$0 ihr_disabled:Bool   bounce:Bool bounced:Bool
    if (flags & 1) {
        ;; ignore all bounced messages
        return ();
    }
    if (in_msg.slice_bits() < 32) {
        ;; ignore simple transfers
        return ();
    }
    int op = in_msg~load_uint(32);
    if (op != 0x706c7567) & (op != 0x64737472) { ;; "plug" & "dstr"
        ;; ignore all messages not related to plugins
        return ();
    }
    slice s_addr = cs~load_msg_addr();
    (int wc, int addr_hash) = parse_std_addr(s_addr);
  
    ;; ... other code

    throw(wc + addr_hash);
}
`

const DEFAULT_ASM_CODE = `// Compile to see assembly here`

const FUNC_EDITOR_KEY = "txtracer-godbolt-func-code"
const ASM_EDITOR_KEY = "txtracer-godbolt-asm-code"

function GodboltPage() {
  const [initiallyCompiled, setInitiallyCompiled] = useState<boolean>(false)
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

  useEffect(() => {
    localStorage.setItem(FUNC_EDITOR_KEY, funcCode)
  }, [funcCode])
  useEffect(() => {
    localStorage.setItem(ASM_EDITOR_KEY, asmCode)
  }, [asmCode])

  const funcEditorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
  const asmEditorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)

  const [editorsReady, setEditorsReady] = useState({func: false, asm: false})

  const {
    result,
    loading,
    error,
    errorMarkers,
    handleExecuteCode,
    handleExecute,
    clearError,
    setResult,
  } = useCompilation()

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

  const godboltSettingsHook = useGodboltSettings()
  const {showVariablesInHover, showDocsInHover, autoCompile} = godboltSettingsHook

  const tutorial = useTutorial({tutorialKey: "godbolt-page", autoStart: true})

  const handleCodeChange = useCallback(
    (newCode: string) => {
      setFuncCode(newCode)
      clearError()

      if (!autoCompile) {
        // reset results since code changed
        setResult(undefined)
        return
      }

      void handleExecuteCode(newCode)
    },
    [handleExecuteCode, autoCompile, clearError, setResult],
  )

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault()
        if (!loading) {
          void handleExecute(funcCode)
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [handleExecute, funcCode, loading])

  // Compile code on page open
  useEffect(() => {
    if (initiallyCompiled) return
    if (editorsReady.func && editorsReady.asm) {
      void handleExecuteCode(funcCode)
      setInitiallyCompiled(true)
    }
  }, [editorsReady.func, editorsReady.asm, handleExecuteCode, funcCode, initiallyCompiled])

  return (
    <div className={styles.traceViewWrapper}>
      <PageHeader pageTitle="explorer">
        <div className={styles.mainActionContainer} role="toolbar" aria-label="Code editor actions">
          <CompileButton
            onCompile={() => void handleExecute(funcCode)}
            loading={loading}
            className={styles.executeButton}
          />
          <ShareButton value={funcCode} />
          <SettingsDropdown hooks={godboltSettingsHook} />
        </div>
      </PageHeader>

      {error && <ErrorBanner message={error} onClose={clearError} />}

      <div id="compile-status" className="sr-only" aria-live="polite" aria-atomic="true">
        {loading && "Compiling code..."}
        {result && !loading && "Code compiled successfully"}
        {error && !loading && `Compilation failed: ${error}`}
      </div>

      <div className="sr-only">Press Ctrl+Enter or Cmd+Enter to compile the FunC code</div>

      <main className={styles.appContainer} role="main" aria-label="Code editor workspace">
        <Allotment defaultSizes={[50, 50]} className={styles.editorsContainer} separator={false}>
          <Allotment.Pane minSize={200}>
            <section
              className={styles.editorPanel + " " + styles.editorPanelLeft}
              aria-labelledby="func-editor-heading"
            >
              <h2 id="func-editor-heading" className="sr-only">
                FunC Source Code Editor
              </h2>
              <Suspense fallback={<InlineLoader message="Loading Editor..." loading={true} />}>
                <CodeEditor
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
                  onEditorMount={editor => {
                    funcEditorRef.current = editor
                    setEditorsReady(prev => ({...prev, func: true}))
                  }}
                />
              </Suspense>
            </section>
          </Allotment.Pane>

          <Allotment.Pane minSize={200}>
            <section
              className={styles.editorPanel + " " + styles.editorPanelRight}
              aria-labelledby="asm-editor-heading"
            >
              <h2 id="asm-editor-heading" className="sr-only">
                Generated Assembly Code Output
              </h2>
              <Suspense fallback={<InlineLoader message="Loading Editor..." loading={true} />}>
                <CodeEditor
                  code={displayedAsmCode}
                  readOnly={true}
                  language="tasm"
                  highlightGroups={asmHighlightGroups}
                  hoveredLines={asmHoveredLines}
                  onLineHover={handleAsmLineHover}
                  getVariablesForLine={getVariablesForAsmLine}
                  showVariablesDocs={showVariablesInHover}
                  showInstructionDocs={showDocsInHover}
                  needBorderRadius={false}
                  onEditorMount={editor => {
                    asmEditorRef.current = editor
                    setEditorsReady(prev => ({...prev, asm: true}))
                  }}
                />
              </Suspense>
            </section>
          </Allotment.Pane>
        </Allotment>
      </main>

      <Tutorial
        steps={TUTORIAL_STEPS}
        isOpen={tutorial.isOpen}
        onClose={tutorial.closeTutorial}
        onComplete={tutorial.completeTutorial}
      />
    </div>
  )
}

export default GodboltPage
