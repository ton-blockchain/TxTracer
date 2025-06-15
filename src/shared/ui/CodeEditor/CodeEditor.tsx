import React, {useCallback, useEffect, useRef, useState} from "react"
import Editor from "@monaco-editor/react"

import * as monaco from "monaco-editor"

import type {ExitCode} from "@features/txTrace/lib/traceTx"
import type {FuncVar} from "@features/godbolt/lib/func/variables.ts"

import {FUNC_LANGUAGE_ID, TASM_LANGUAGE_ID} from "@shared/ui/CodeEditor/languages"

import type {LinesExecutionData} from "@features/txTrace/hooks"

import {
  useMonacoSetup,
  useDecorations,
  useEditorEvents,
  useTasmHoverProvider,
  useTasmCodeLensProvider,
  useTasmCompletionProvider,
  useFuncLanguageProviders,
  useFolding,
  type SupportedLanguage,
  type HighlightGroup,
  type HighlightRange,
} from "./hooks"

import styles from "./CodeEditor.module.css"

interface CodeEditorProps {
  /* -------------------------------- Core Editor -------------------------------- */
  /** The source code to display in the editor */
  readonly code: string

  /** Programming language for syntax highlighting. Supports 'tasm' and 'func' */
  readonly language?: SupportedLanguage

  /** Whether the editor is read-only or allows editing */
  readonly readOnly?: boolean

  /** Whether to apply border radius to the editor wrapper */
  readonly needBorderRadius?: boolean

  /** Callback fired when the Monaco editor instance is mounted and ready */
  readonly onEditorMount?: (editor: monaco.editor.IStandaloneCodeEditor) => void

  /* -------------------------------- Trace Features -------------------------------- */
  /** Line number to highlight (1-indexed). Used for showing the current execution step */
  readonly highlightLine?: number

  /** Execution data for each line including gas costs and execution counts */
  readonly lineExecutionData?: LinesExecutionData

  /** Callback fired when a user ctrl+clicks on a line with gas data */
  readonly onLineClick?: (line: number) => void

  /** Whether to center the editor view on the highlighted line */
  readonly shouldCenter?: boolean

  /** Exit code information to display as code lens above the error line */
  readonly exitCode?: ExitCode

  /** Whether to show instruction documentation in hover tooltips for TASM */
  readonly showInstructionDocs?: boolean

  /* -------------------------------- Godbolt/Source Mapping -------------------------------- */
  /** Groups of lines to highlight with different colors. Used for source map visualization */
  readonly highlightGroups?: readonly HighlightGroup[]

  /** Individual lines to highlight with hover effect. Used for temporary highlighting */
  readonly hoveredLines?: readonly number[]

  /** Specific text ranges to highlight with precise positioning */
  readonly highlightRanges?: readonly HighlightRange[]

  /** Callback fired when a user hovers over a line. Used for source map highlighting */
  readonly onLineHover?: (line: number | null) => void

  /** Function to get variable information for a specific line. Used in TASM hover tooltips */
  readonly getVariablesForLine?: (line: number) => FuncVar[] | undefined

  /** Whether to show variable documentation in hover tooltips for TASM */
  readonly showVariablesDocs?: boolean

  /* -------------------------------- Playground/Editing -------------------------------- */
  /** Callback fired when the code content changes */
  readonly onChange?: (value: string) => void

  /** Error markers to display in the editor. Used for compilation errors in FunC on the Code Explorer page */
  readonly markers?: readonly monaco.editor.IMarkerData[]
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  code,
  highlightLine,
  lineExecutionData,
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
  onEditorMount,
}) => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
  const [editorReady, setEditorReady] = useState(false)
  const [isFoldedState, setIsFolded] = useState(false)

  const {monaco, isMac} = useMonacoSetup({language})

  const {isCtrlPressed, hoveredLine} = useEditorEvents({
    monaco,
    editorRef,
    lineExecutionData,
    onLineClick,
    onLineHover,
    editorReady,
  })

  const {updateDecorations} = useDecorations({
    monaco,
    highlightLine,
    lineExecutionData,
    highlightGroups,
    hoveredLines,
    highlightRanges,
    isCtrlPressed,
    hoveredLine,
    shouldCenter,
  })

  useTasmHoverProvider({
    monaco,
    editorRef,
    lineExecutionData,
    getVariablesForLine,
    showVariablesDocs,
    showInstructionDocs,
    enabled: language === "tasm",
  })

  useTasmCodeLensProvider({
    monaco,
    editorRef,
    exitCode,
    editorReady,
    enabled: language === "tasm",
  })

  useTasmCompletionProvider({
    monaco,
    editorRef,
    editorReady,
    enabled: language === "tasm",
  })

  useFuncLanguageProviders({
    monaco,
    editorRef,
    markers,
    enabled: language === "func",
  })

  const {collapseInactiveBlocks} = useFolding({
    monaco,
    editorRef,
    lineExecutionData,
  })

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
  }, [lineExecutionData, updateDecorations, handleCollapseInactiveBlocks, isFoldedState])

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
  const needFloatingTip = lineExecutionData && language === "tasm"

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
          loading={<></>}
          onMount={editor => {
            editorRef.current = editor
            setEditorReady(true)
            if (onEditorMount) {
              onEditorMount(editor)
            }
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
}

CodeEditor.displayName = "CodeEditor"

export default React.memo(CodeEditor)
