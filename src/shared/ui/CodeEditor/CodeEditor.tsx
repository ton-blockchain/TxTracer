import React, {useCallback, useEffect, useRef, useState} from "react"
import Editor from "@monaco-editor/react"
import * as monacoTypes from "monaco-editor"

import type {ExitCode} from "@features/txTrace/lib/traceTx"
import type {FuncVar} from "@features/godbolt/lib/func/variables.ts"

import {FUNC_LANGUAGE_ID, TASM_LANGUAGE_ID} from "@shared/ui/CodeEditor/languages"

import {
  useMonacoSetup,
  useDecorations,
  useEditorEvents,
  useLanguageProviders,
  useFolding,
  type SupportedLanguage,
  type HighlightGroup,
  type HighlightRange,
} from "./hooks"

import styles from "./CodeEditor.module.css"

interface CodeEditorProps {
  readonly code: string
  readonly highlightLine?: number
  readonly lineGas?: Record<number, number>
  readonly lineExecutions?: Record<number, number>
  readonly onLineClick?: (line: number) => void
  readonly onLineHover?: (line: number | null) => void
  readonly shouldCenter?: boolean
  readonly exitCode?: ExitCode
  readonly readOnly?: boolean
  readonly onChange?: (value: string) => void
  readonly language?: SupportedLanguage
  readonly highlightGroups?: readonly HighlightGroup[]
  readonly hoveredLines?: readonly number[]
  readonly highlightRanges?: readonly HighlightRange[]
  readonly markers?: readonly monacoTypes.editor.IMarkerData[]
  readonly needBorderRadius?: boolean
  readonly getVariablesForLine?: (line: number) => FuncVar[] | undefined
  readonly showVariablesDocs?: boolean
  readonly showInstructionDocs?: boolean
}

const CodeEditor = React.forwardRef<
  monacoTypes.editor.IStandaloneCodeEditor | null,
  CodeEditorProps
>(
  (
    {
      code,
      highlightLine,
      lineGas,
      lineExecutions,
      onLineClick = () => {},
      onLineHover,
      shouldCenter = true,
      exitCode,
      readOnly = true,
      onChange,
      language = "tasm",
      highlightGroups = [],
      hoveredLines = [],
      highlightRanges = [],
      markers = [],
      needBorderRadius = true,
      getVariablesForLine,
      showVariablesDocs = true,
      showInstructionDocs = true,
    },
    ref,
  ) => {
    const editorRef = useRef<monacoTypes.editor.IStandaloneCodeEditor | null>(null)
    const [editorReady, setEditorReady] = useState(false)
    const [isFoldedState, setIsFolded] = useState(false)

    const {monaco, isMac} = useMonacoSetup({language})

    const {isCtrlPressed, hoveredLine} = useEditorEvents({
      monaco,
      editorRef,
      lineGas,
      onLineClick,
      onLineHover,
      editorReady,
    })

    const {updateDecorations} = useDecorations({
      monaco,
      highlightLine,
      lineGas,
      highlightGroups,
      hoveredLines,
      highlightRanges,
      isCtrlPressed,
      hoveredLine,
      shouldCenter,
    })

    useLanguageProviders({
      monaco,
      editorRef,
      language,
      lineExecutions,
      getVariablesForLine,
      showVariablesDocs,
      showInstructionDocs,
      exitCode,
      markers,
      editorReady,
    })

    const {collapseInactiveBlocks} = useFolding({
      monaco,
      editorRef,
      lineExecutions,
    })

    // @ts-expect-error todo
    // we need it actually
    // eslint-disable-next-line react-hooks/exhaustive-deps
    React.useImperativeHandle(ref, () => editorRef.current, [editorRef.current])

    /* ----------------------- folding inactive blocks ----------------------- */
    const handleCollapseInactiveBlocks = useCallback(() => {
      if (isFoldedState) return
      setIsFolded(true)
      collapseInactiveBlocks()
    }, [collapseInactiveBlocks, isFoldedState])

    /* -------------------------------- effects ------------------------------ */
    useEffect(() => {
      if (!editorRef.current) return
      if (isFoldedState) return // don't apply decorations and folds a second time

      updateDecorations(editorRef.current)
      handleCollapseInactiveBlocks()
    }, [lineGas, updateDecorations, handleCollapseInactiveBlocks, isFoldedState])

    useEffect(() => {
      if (!editorReady || !editorRef.current) return

      updateDecorations(editorRef.current)
      handleCollapseInactiveBlocks()
    }, [editorReady, updateDecorations, handleCollapseInactiveBlocks])

    // Update decorations on pressed ctrl
    useEffect(() => {
      if (editorRef.current) {
        updateDecorations(editorRef.current)
      }
    }, [isCtrlPressed, updateDecorations])

    // Handle resize events
    useEffect(() => {
      if (!editorReady || !editorRef.current) {
        return
      }

      const handleResize = () => {
        editorRef.current?.layout()
      }

      window.addEventListener("resize", handleResize)
      handleResize()

      return () => {
        window.removeEventListener("resize", handleResize)
      }
    }, [editorReady])

    /* -------------------------------- render ------------------------------- */
    const needFloatingTip = lineGas && readOnly && language === "tasm"

    return (
      <>
        <div
          className={
            needBorderRadius
              ? styles.editorWrapperWithBorderRadius
              : styles.editorWrapperWithoutBorderRadius
          }
        >
          <Editor
            height="100%"
            width="100%"
            language={language === "func" ? FUNC_LANGUAGE_ID : TASM_LANGUAGE_ID}
            path={language === "func" ? "main.fc" : "out.tasm"}
            value={code}
            options={{
              minimap: {enabled: false},
              readOnly,
              lineNumbers: "on",
              automaticLayout: true,
              scrollBeyondLastLine: false,
              wordWrap: "on",
              fontSize: 14,
              fontFamily: "JetBrains Mono",
              glyphMargin: true,
              folding: true,
              foldingStrategy: "auto",
              stickyScroll: {enabled: false},
              scrollbar: {
                useShadows: false,
              },
            }}
            onMount={editor => {
              editorRef.current = editor
              setEditorReady(true)
            }}
            onChange={value => {
              if (onChange !== undefined && value !== undefined) {
                onChange(value)
              }
              if (editorRef.current) {
                updateDecorations(editorRef.current)
              }
            }}
          />
        </div>
        {needFloatingTip && (
          <div className={styles.editorHint}>
            <kbd>{isMac ? "⌘" : "Ctrl"}</kbd> + <kbd>Click</kbd> to navigate to trace step
            <span className={styles.hintDivider}>|</span>
            <kbd>←</kbd> <kbd>→</kbd> to step through trace
          </div>
        )}
      </>
    )
  },
)

CodeEditor.displayName = "CodeEditor"

export default React.memo(CodeEditor)
