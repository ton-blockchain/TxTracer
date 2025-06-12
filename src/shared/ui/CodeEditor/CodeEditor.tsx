import React, {useCallback, useEffect, useRef, useState} from "react"
import Editor, {useMonaco} from "@monaco-editor/react"
import * as monacoTypes from "monaco-editor"
import {editor, type IMarkdownString, Position} from "monaco-editor"

import {useTheme} from "@shared/lib/themeContext"
import type {ExitCode} from "@features/txTrace/lib/traceTx"
import {asmData, findInstruction, generateAsmDoc} from "@features/txTrace/lib/asm"

import {funcLanguageDefinition} from "@shared/ui/CodeEditor/FuncLanguageDefinition.ts"

import {DARK_THEME, LIGHT_THEME} from "@shared/ui/CodeEditor/themes.tsx"

import {FUNC_LANGUAGE_ID, TASM_LANGUAGE_ID, tasmLanguageDefinition} from "./TasmLanguageDefinition"
import styles from "./CodeEditor.module.css"

export interface HighlightGroup {
  readonly lines: number[]
  readonly color: string
  readonly className?: string
}

export interface HighlightRange {
  readonly line: number
  readonly startColumn: number
  readonly endColumn: number
  readonly color: string
  readonly className?: string
}

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
  readonly language?: "tasm" | "func"
  readonly highlightGroups?: readonly HighlightGroup[]
  readonly hoveredLines?: readonly number[]
  readonly highlightRanges?: readonly HighlightRange[]
  readonly markers?: readonly monacoTypes.editor.IMarkerData[]
  readonly needBorderRadius?: boolean
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

const initializeMonaco = (monaco: typeof monacoTypes, language?: "tasm" | "func") => {
  if (language === "tasm") {
    monaco.languages.register({id: TASM_LANGUAGE_ID})
    monaco.languages.setMonarchTokensProvider(TASM_LANGUAGE_ID, tasmLanguageDefinition)
  }

  if (language === "func") {
    monaco.languages.register({id: FUNC_LANGUAGE_ID})
    monaco.languages.setMonarchTokensProvider(FUNC_LANGUAGE_ID, funcLanguageDefinition)
  }

  monaco.editor.defineTheme("light-theme", LIGHT_THEME)
  monaco.editor.defineTheme("dark-theme", DARK_THEME)
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
    },
    ref,
  ) => {
    const monaco = useMonaco()
    const editorRef = useRef<monacoTypes.editor.IStandaloneCodeEditor | null>(null)

    // @ts-expect-error todo
    // we need it actually
    // eslint-disable-next-line react-hooks/exhaustive-deps
    React.useImperativeHandle(ref, () => editorRef.current, [editorRef.current])
    const decorationsRef = useRef<string[]>([])
    const [editorReady, setEditorReady] = useState(false)
    const [isFoldedState, setIsFolded] = useState(false)
    const [isCtrlPressed, setIsCtrlPressed] = useState(false)
    const [hoveredLine, setHoveredLine] = useState<number | null>(null)
    const {theme: appTheme} = useTheme()
    const [isMac, setIsMac] = useState(false)

    /* --------------------------------- init -------------------------------- */
    useEffect(() => {
      if (!monaco) return
      initializeMonaco(monaco, language)
    }, [monaco, language])

    useEffect(() => {
      if (typeof window !== "undefined" && typeof navigator !== "undefined") {
        // noinspection JSDeprecatedSymbols
        // better way?
        setIsMac(navigator.platform.toUpperCase().indexOf("MAC") >= 0)
      }
    }, [])

    useEffect(() => {
      if (!monaco) return
      monaco.editor.setTheme(appTheme === "dark" ? "dark-theme" : "light-theme")
    }, [appTheme, monaco, editorReady, language])

    useEffect(() => {
      if (editorReady && language === "tasm") {
        // preload assembly data
        asmData()
      }
    }, [editorReady, language])

    /* ---------------------------- decorations ------------------------------ */
    const updateDecorations = useCallback(() => {
      if (!editorRef.current || !monaco) return

      const model = editorRef.current.getModel()
      if (!model) return

      const totalLines = model.getLineCount()
      const allDecorations: monacoTypes.editor.IModelDeltaDecoration[] = []

      // highlight the requested line (used for the current line step)
      if (highlightLine !== undefined) {
        allDecorations.push({
          range: new monaco.Range(highlightLine, 1, highlightLine, 1),
          options: {
            isWholeLine: true,
            className: "highlighted-line",
          },
        })
      }

      // Add source map highlight groups
      for (const [index, group] of highlightGroups.entries()) {
        for (const lineNumber of group.lines) {
          if (lineNumber > 0 && lineNumber <= totalLines) {
            allDecorations.push({
              range: new monaco.Range(lineNumber, 1, lineNumber, 1),
              options: {
                isWholeLine: true,
                className: group.className || `source-map-group-${index}`,
                overviewRuler: {
                  color: group.color,
                  position: 1,
                },
              },
            })
          }
        }
      }

      // Add hovered lines highlighting
      for (const lineNumber of hoveredLines) {
        if (lineNumber > 0 && lineNumber <= totalLines) {
          allDecorations.push({
            range: new monaco.Range(lineNumber, 1, lineNumber, 1),
            options: {
              isWholeLine: true,
              className: "source-map-hovered-line",
            },
          })
        }
      }

      for (const range of highlightRanges) {
        if (range.line > 0 && range.line <= totalLines) {
          allDecorations.push({
            range: new monaco.Range(range.line, range.startColumn, range.line, range.endColumn),
            options: {
              isWholeLine: false,
              className: range.className || "precise-highlight",
              inlineClassName: range.className || "precise-highlight",
            },
          })
        }
      }

      // highlight every line in editor
      // 1. if a line was not executed, it grayed out
      // 2. if a line was executed,
      //    1. if the user hovers over this line, we highlight it with deep blue
      //    2. otherwise highlight it as clickable
      if (lineGas && Object.keys(lineGas).length > 0) {
        for (let line = 1; line <= totalLines; line++) {
          const text = model.getLineContent(line)
          const isEmpty = text.trim() === ""
          if (isEmpty) continue

          const wasExecuted = lineGas[line] !== undefined

          if (wasExecuted && isCtrlPressed) {
            const className =
              hoveredLine === line
                ? "clickable-line ctrl-pressed hovered-line"
                : "clickable-line ctrl-pressed"
            allDecorations.push({
              range: new monaco.Range(line, 1, line, 1),
              options: {
                isWholeLine: true,
                className,
                linesDecorationsClassName: "clickable-line-decoration",
              },
            })
          } else if (!wasExecuted) {
            allDecorations.push({
              range: new monaco.Range(line, 1, line, model.getLineLength(line) + 1),
              options: {
                isWholeLine: false,
                inlineClassName: "faded-text",
              },
            })
          }
        }
      }

      // noinspection JSDeprecatedSymbols
      decorationsRef.current = editorRef.current.deltaDecorations(
        decorationsRef.current,
        allDecorations,
      )

      // when the user steps, we automatically centered editor for better visibility,
      // but when the user clicks on a certain line, we don't want to scroll editor to avoid
      // sharp scroll from under the cursor
      if (highlightLine !== undefined && shouldCenter) {
        editorRef.current.revealLineInCenter(highlightLine)
      }
    }, [
      monaco,
      lineGas,
      highlightLine,
      shouldCenter,
      isCtrlPressed,
      hoveredLine,
      highlightGroups,
      hoveredLines,
      highlightRanges,
    ])

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
      if (isFoldedState) return // don't apply decorations and folds a second time
      updateDecorations()
      collapseInactiveBlocks()
    }, [lineGas, updateDecorations, collapseInactiveBlocks, isFoldedState])

    useEffect(() => {
      if (!editorReady) return
      updateDecorations()
      collapseInactiveBlocks()
    }, [editorReady, updateDecorations, collapseInactiveBlocks])

    /* --------------------------- editor listeners -------------------------- */
    useEffect(() => {
      if (!editorRef.current) return
      const disposable = editorRef.current.onMouseDown((e: editor.IEditorMouseEvent) => {
        if (
          e.target.type !== monaco?.editor.MouseTargetType.GUTTER_LINE_NUMBERS &&
          e.event.leftButton &&
          (e.event.ctrlKey || e.event.metaKey)
        ) {
          const lineNumber = e.target.position?.lineNumber
          if (lineNumber && lineGas && lineGas[lineNumber] !== undefined) onLineClick(lineNumber)
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

    // update decorations on pressed ctrl
    useEffect(() => {
      if (editorRef.current) {
        updateDecorations()
      }
    }, [isCtrlPressed, updateDecorations])

    useEffect(() => {
      if (!monaco || !editorReady) return

      const provider = monaco.languages.registerHoverProvider(TASM_LANGUAGE_ID, {
        provideHover(model: editor.ITextModel, position: Position) {
          const word = model.getWordAtPosition(position)
          if (!word) return null

          const lineNumber = position.lineNumber
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

          if (lineExecutions && lineGas && tokenType.includes("instruction")) {
            const gasUsed = lineGas[lineNumber]
            const executionCount = lineExecutions[lineNumber]
            const hoverContents: IMarkdownString[] = []

            const instructionInfo = findInstruction(word.word)
            if (instructionInfo === undefined) {
              hoverContents.push({
                value:
                  "The assembly instructions documentation is loading—please hover over the instruction again.",
              })
              hoverContents.push({value: "---"})
            }
            if (instructionInfo) {
              const asmDoc = generateAsmDoc(instructionInfo)
              if (asmDoc) {
                hoverContents.push({value: asmDoc})
                hoverContents.push({value: "---"})
              }
            }

            if (gasUsed === undefined && executionCount === undefined) {
              hoverContents.push({value: `**Not executed**`})
            } else if (executionCount !== undefined) {
              hoverContents.push({value: `**Executions:** ${executionCount}`})
            }

            return {
              range: new monaco.Range(
                position.lineNumber,
                word.startColumn,
                position.lineNumber,
                word.endColumn,
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
    }, [monaco, editorReady, lineGas, lineExecutions])

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
    }, [monaco, editorReady, exitCode])

    useEffect(() => {
      if (!monaco || !editorRef.current || !markers) return

      const model = editorRef.current.getModel()
      if (!model) return

      monaco.editor.setModelMarkers(model, "FunC", [...markers])

      return () => {
        monaco.editor.setModelMarkers(model, "FunC", [])
      }
    }, [monaco, markers, editorReady])

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
              updateDecorations()
            }}
          />
        </div>
        {lineGas && readOnly && language === "tasm" && (
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
