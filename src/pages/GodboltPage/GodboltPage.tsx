import React, {useState, useCallback, Suspense, useEffect, useMemo, useRef} from "react"

import {Allotment} from "allotment"
import "allotment/dist/style.css"

import type * as monaco from "monaco-editor"

import {trace} from "ton-assembly-test-dev/dist"

import InlineLoader from "@shared/ui/InlineLoader"
import ErrorBanner from "@shared/ui/ErrorBanner/ErrorBanner"
import PageHeader from "@shared/ui/PageHeader"

import {CompileButton, SettingsDropdown, ShareButton} from "@app/pages/GodboltPage/components"

import {useSourceMapHighlight} from "@app/pages/GodboltPage/hooks"

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
                  }}
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
                  }}
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
