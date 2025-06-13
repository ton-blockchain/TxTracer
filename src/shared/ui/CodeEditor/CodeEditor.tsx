import React, {useCallback, useEffect, useRef, useState} from "react"
import Editor from "@monaco-editor/react"
import * as monacoTypes from "monaco-editor"
import {editor, type IMarkdownString, Position} from "monaco-editor"

import {findInstruction, generateAsmDoc} from "@features/tasm/lib"
import type {ExitCode} from "@features/txTrace/lib/traceTx"
import {formatVariablesForHover, type FuncVar} from "@features/godbolt/lib/func/variables.ts"

import {FUNC_LANGUAGE_ID, TASM_LANGUAGE_ID} from "@shared/ui/CodeEditor/languages"

import {
  useMonacoSetup,
  useDecorations,
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

interface CodeBlock {
  readonly start: number
  readonly end: number
  readonly lines: unknown[]
}

interface FoldingRange {
  readonly start: number
  readonly end: number
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
    const [isCtrlPressed, setIsCtrlPressed] = useState(false)
    const [hoveredLine, setHoveredLine] = useState<number | null>(null)

    const {monaco, isMac} = useMonacoSetup({language})
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

    // @ts-expect-error todo
    // we need it actually
    // eslint-disable-next-line react-hooks/exhaustive-deps
    React.useImperativeHandle(ref, () => editorRef.current, [editorRef.current])

    /* ---------------------------- decorations ------------------------------ */
    // Decorations are now handled by the useDecorations hook

    /* ----------------------- folding inactive blocks ----------------------- */
    const collapseInactiveBlocks = useCallback(() => {
      if (!editorRef.current || !monaco) return
      if (isFoldedState) return
      setIsFolded(true)

      try {
        editorRef.current.trigger("unfold", "editor.unfoldAll", {})
      } catch (_) {
        // ignored
      }

      const model = editorRef.current.getModel()
      if (!model) return

      if (!lineGas || Object.keys(lineGas).length === 0) return

      const totalLines = model.getLineCount()
      const foldingRanges: FoldingRange[] = []
      const codeBlocks: CodeBlock[] = []
      const blockStack: number[] = []

      for (let line = 1; line <= totalLines; line++) {
        const lineText = model.getLineContent(line)
        const openBraces = (lineText.match(/\{/g) ?? []).length
        const closeBraces = (lineText.match(/}/g) ?? []).length
        for (let i = 0; i < openBraces; i++) {
          blockStack.push(line)
        }
        for (let i = 0; i < closeBraces; i++) {
          if (blockStack.length > 0) {
            const startLine = blockStack.pop() ?? 0
            codeBlocks.push({start: startLine, end: line, lines: []})
          }
        }
      }

      for (const block of codeBlocks) {
        let allLinesInactive = true
        for (let line = block.start; line <= block.end; line++) {
          const lineText = model.getLineContent(line)
          const isActiveLine = lineGas[line] !== undefined
          const isEmpty = lineText.trim() === ""
          if (isActiveLine && !isEmpty) {
            allLinesInactive = false
            break
          }
        }
        if (allLinesInactive && block.start < block.end) {
          foldingRanges.push({start: block.start, end: block.end})
        }
      }

      setTimeout(() => {
        for (const range of foldingRanges) {
          try {
            editorRef.current?.trigger("fold", "editor.fold", {
              selectionLines: [range.start],
            })
          } catch (_) {
            // ignored
          }
        }
      }, 100)
    }, [lineGas, monaco, isFoldedState])

    /* -------------------------------- effects ------------------------------ */
    useEffect(() => {
      if (!editorRef.current) return
      if (isFoldedState) return // don't apply decorations and folds a second time

      updateDecorations(editorRef.current)
      collapseInactiveBlocks()
    }, [lineGas, updateDecorations, collapseInactiveBlocks, isFoldedState])

    useEffect(() => {
      if (!editorReady || !editorRef.current) return

      updateDecorations(editorRef.current)
      collapseInactiveBlocks()
    }, [editorReady, updateDecorations, collapseInactiveBlocks])

    /* --------------------------- editor listeners -------------------------- */
    // Line click handler
    useEffect(() => {
      if (!editorRef.current) return
      const disposable = editorRef.current.onMouseDown((e: editor.IEditorMouseEvent) => {
        if (
          e.target.type !== monaco?.editor.MouseTargetType.GUTTER_LINE_NUMBERS &&
          e.event.leftButton &&
          (e.event.ctrlKey || e.event.metaKey)
        ) {
          const lineNumber = e.target.position?.lineNumber
          if (lineNumber && lineGas && lineGas[lineNumber] !== undefined) {
            onLineClick(lineNumber)
          }
        }
      })
      return () => disposable.dispose()
    }, [editorReady, lineGas, onLineClick, monaco])

    /* ------------------------ global key/mouse state ----------------------- */
    const handleKeyDown = useCallback(
      (e: KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && !isCtrlPressed) {
          setIsCtrlPressed(true)
        }
      },
      [isCtrlPressed, setIsCtrlPressed],
    )

    const handleKeyUp = useCallback(
      (e: KeyboardEvent) => {
        if (!e.ctrlKey && !e.metaKey && isCtrlPressed) {
          setIsCtrlPressed(false)
          setHoveredLine(null)
        }
      },
      [isCtrlPressed, setIsCtrlPressed, setHoveredLine],
    )

    const handleBlur = useCallback(() => {
      if (isCtrlPressed) {
        setIsCtrlPressed(false)
        setHoveredLine(null)
      }
    }, [isCtrlPressed, setIsCtrlPressed, setHoveredLine])

    // Keyboard events
    useEffect(() => {
      document.addEventListener("keydown", handleKeyDown)
      document.addEventListener("keyup", handleKeyUp)
      window.addEventListener("blur", handleBlur)
      return () => {
        document.removeEventListener("keydown", handleKeyDown)
        document.removeEventListener("keyup", handleKeyUp)
        window.removeEventListener("blur", handleBlur)
      }
    }, [handleKeyDown, handleKeyUp, handleBlur])

    // Update decorations on pressed ctrl
    useEffect(() => {
      if (editorRef.current) {
        updateDecorations(editorRef.current)
      }
    }, [isCtrlPressed, updateDecorations])

    // Hover documentation support
    useEffect(() => {
      if (!monaco || !editorRef.current) return

      const provider = monaco.languages.registerHoverProvider(TASM_LANGUAGE_ID, {
        provideHover(model: editor.ITextModel, position: Position) {
          if (language !== "tasm") return null

          const word = model.getWordAtPosition(position)
          const lineNumber = position.lineNumber
          const hoverContents: IMarkdownString[] = []

          if (showVariablesDocs && getVariablesForLine) {
            const variables = getVariablesForLine(lineNumber)
            if (variables && variables.length > 0) {
              hoverContents.push({value: formatVariablesForHover(variables)})
              hoverContents.push({value: "---"})
            }
          }

          if (word) {
            const lineContent = model.getLineContent(lineNumber)
            const tokens = monaco.editor.tokenize(lineContent, TASM_LANGUAGE_ID)[0]
            let tokenType = ""
            for (let i = 0; i < tokens.length; i++) {
              const token = tokens[i]
              const start = token.offset + 1
              const end = i + 1 < tokens.length ? tokens[i + 1].offset + 1 : lineContent.length + 1
              if (position.column >= start && position.column < end) {
                tokenType = token.type
                break
              }
            }

            if (tokenType.includes("instruction") && showInstructionDocs) {
              const instructionInfo = findInstruction(word.word)
              if (instructionInfo === undefined) {
                hoverContents.push({
                  value:
                    "The assembly instructions documentation is loading—please hover over the instruction again.",
                })
              } else if (instructionInfo) {
                const asmDoc = generateAsmDoc(instructionInfo)
                if (asmDoc) {
                  hoverContents.push({value: asmDoc})
                }
              }

              if (lineExecutions) {
                const executionCount = lineExecutions[lineNumber]

                if (hoverContents.length > 0) {
                  hoverContents.push({value: "---"})
                }

                if (executionCount === undefined) {
                  hoverContents.push({value: `**Not executed**`})
                } else {
                  hoverContents.push({value: `**Executions:** ${executionCount}`})
                }
              }
            }
          }

          if (hoverContents.length > 0) {
            return {
              range: word
                ? new monaco.Range(
                    position.lineNumber,
                    word.startColumn,
                    position.lineNumber,
                    word.endColumn,
                  )
                : new monaco.Range(
                    position.lineNumber,
                    1,
                    position.lineNumber,
                    model.getLineLength(position.lineNumber) + 1,
                  ),
              contents: hoverContents,
            }
          }
          return null
        },
      })

      return () => {
        provider.dispose()
      }
    }, [
      monaco,
      language,
      lineExecutions,
      getVariablesForLine,
      showInstructionDocs,
      showVariablesDocs,
    ])

    // Ctrl+click go to line support
    useEffect(() => {
      if (!monaco || !editorRef.current) return

      if (isCtrlPressed) {
        const disposable = editorRef.current.onMouseMove((e: editor.IEditorMouseEvent) => {
          const lineNumber = e.target.position?.lineNumber
          if (lineNumber && lineGas && lineGas[lineNumber] !== undefined) {
            setHoveredLine(lineNumber)
          } else setHoveredLine(null)
        })

        // remove decoration if user leave editor
        const handleMouseLeave = () => setHoveredLine(null)
        const editorDom = editorRef.current.getDomNode()
        if (editorDom) {
          editorDom.addEventListener("mouseleave", handleMouseLeave)
        }
        return () => {
          disposable.dispose()
          editorDom?.removeEventListener("mouseleave", handleMouseLeave)
        }
      }
    }, [isCtrlPressed, lineGas, monaco])

    // Source map hover support
    useEffect(() => {
      if (!monaco || !editorRef.current || !onLineHover) return

      const disposable = editorRef.current.onMouseMove((e: editor.IEditorMouseEvent) => {
        const lineNumber = e.target.position?.lineNumber
        if (lineNumber) {
          onLineHover(lineNumber)
        }
      })

      const handleMouseLeave = () => onLineHover(null)
      const editorDom = editorRef.current.getDomNode()
      if (editorDom) {
        editorDom.addEventListener("mouseleave", handleMouseLeave)
      }

      return () => {
        disposable.dispose()
        editorDom?.removeEventListener("mouseleave", handleMouseLeave)
      }
    }, [monaco, onLineHover])

    // Code lenses feature
    useEffect(() => {
      if (!monaco || !editorRef.current) return

      const provider = monaco.languages.registerCodeLensProvider(TASM_LANGUAGE_ID, {
        provideCodeLenses: model => {
          if (!exitCode?.info?.loc?.line) {
            return {
              lenses: [],
              dispose: () => {},
            }
          }

          const line = exitCode.info.loc.line + 1
          if (line <= 0 || line > model.getLineCount()) {
            return {
              lenses: [],
              dispose: () => {},
            }
          }

          const description = exitCode.description ? `: ${exitCode.description}` : ``
          const lenses: monacoTypes.languages.CodeLens[] = [
            {
              range: new monaco.Range(line, 1, line, 1),
              id: `exitCode-${line}`,
              command: {
                id: "noop",
                title: `⚡ Exit Code: ${exitCode.num}${description}`,
                tooltip: `Transaction failed with exit code ${exitCode.num}${description}`,
              },
            },
          ]

          return {
            lenses: lenses,
            dispose: () => {},
          }
        },
        resolveCodeLens: (_model, codeLens) => {
          return codeLens
        },
      })

      return () => {
        provider.dispose()
      }
    }, [monaco, exitCode])

    // Set code errors for FunC
    useEffect(() => {
      if (!monaco || !editorRef.current || !markers) return

      const model = editorRef.current.getModel()
      if (!model) return

      monaco.editor.setModelMarkers(model, "FunC", [...markers])

      return () => {
        monaco.editor.setModelMarkers(model, "FunC", [])
      }
    }, [monaco, markers, editorReady])

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
