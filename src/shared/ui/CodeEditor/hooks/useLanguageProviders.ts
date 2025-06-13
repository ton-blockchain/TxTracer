import {useEffect, type RefObject} from "react"
import type * as monacoTypes from "monaco-editor"
import {editor, type IMarkdownString, Position} from "monaco-editor"

import {findInstruction, generateAsmDoc} from "@features/tasm/lib"
import type {ExitCode} from "@features/txTrace/lib/traceTx"
import {formatVariablesForHover, type FuncVar} from "@features/godbolt/lib/func/variables"

import {TASM_LANGUAGE_ID} from "../languages"

import type {SupportedLanguage} from "./useMonacoSetup"

interface UseLanguageProvidersOptions {
  readonly monaco: typeof monacoTypes | null
  readonly editorRef: RefObject<monacoTypes.editor.IStandaloneCodeEditor | null>
  readonly language: SupportedLanguage
  readonly lineExecutions?: Record<number, number>
  readonly getVariablesForLine?: (line: number) => FuncVar[] | undefined
  readonly showVariablesDocs?: boolean
  readonly showInstructionDocs?: boolean
  readonly exitCode?: ExitCode
  readonly markers?: readonly monacoTypes.editor.IMarkerData[]
  readonly editorReady: boolean
}

export const useLanguageProviders = (options: UseLanguageProvidersOptions): void => {
  const {
    monaco,
    editorRef,
    language,
    lineExecutions,
    getVariablesForLine,
    showVariablesDocs = true,
    showInstructionDocs = true,
    exitCode,
    markers = [],
    editorReady,
  } = options

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
    editorRef,
  ])

  // Code lenses feature
  useEffect(() => {
    if (!monaco || !editorRef.current || !editorReady) return

    const provider = monaco.languages.registerCodeLensProvider(TASM_LANGUAGE_ID, {
      provideCodeLenses: model => {
        if (language !== "tasm") {
          return {
            lenses: [],
            dispose: () => {},
          }
        }

        if (!exitCode?.info?.loc?.line && exitCode?.info?.loc?.line !== 0) {
          console.log("No exit code line info")
          return {
            lenses: [],
            dispose: () => {},
          }
        }

        const line = exitCode.info.loc.line + 1
        if (line <= 0 || line > model.getLineCount()) {
          console.log("Exit code line out of bounds:", line, "total lines:", model.getLineCount())
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
  }, [monaco, exitCode, editorRef, editorReady, language])

  // Set code errors for FunC
  useEffect(() => {
    if (!monaco || !editorRef.current || !markers) return

    const model = editorRef.current.getModel()
    if (!model) return

    monaco.editor.setModelMarkers(model, "FunC", [...markers])

    return () => {
      monaco.editor.setModelMarkers(model, "FunC", [])
    }
  }, [monaco, markers, editorReady, editorRef])
}
