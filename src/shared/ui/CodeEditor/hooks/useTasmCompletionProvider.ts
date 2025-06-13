import {useEffect, type RefObject} from "react"
import type * as monacoTypes from "monaco-editor"
import {editor, languages, Position} from "monaco-editor"

import {asmData} from "@features/tasm/lib"

import {TASM_LANGUAGE_ID} from "../languages"

interface UseTasmCompletionProviderOptions {
  readonly monaco: typeof monacoTypes | null
  readonly editorRef: RefObject<monacoTypes.editor.IStandaloneCodeEditor | null>
  readonly enabled?: boolean
  readonly editorReady: boolean
}

export const useTasmCompletionProvider = ({
  monaco,
  editorRef,
  editorReady,
  enabled = true,
}: UseTasmCompletionProviderOptions): void => {
  useEffect(() => {
    if (!monaco || !editorRef.current || !editorReady || !enabled) return

    const provider = monaco.languages.registerCompletionItemProvider(TASM_LANGUAGE_ID, {
      triggerCharacters: [],
      provideCompletionItems(model: editor.ITextModel, position: Position) {
        const data = asmData()

        if (!data) {
          return {suggestions: []}
        }

        const word = model.getWordUntilPosition(position)
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        }

        const inputText = word.word.toUpperCase()
        const suggestions: languages.CompletionItem[] = []

        for (const instruction of data.instructions) {
          if (inputText && !instruction.mnemonic.startsWith(inputText)) {
            continue
          }

          suggestions.push({
            label: instruction.mnemonic,
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: instruction.mnemonic + " ",
            range,
            sortText: `0_${instruction.mnemonic}`,
            filterText: instruction.mnemonic,
          })
        }

        for (const alias of data.aliases) {
          if (inputText && !alias.mnemonic.startsWith(inputText)) {
            continue
          }

          suggestions.push({
            label: alias.mnemonic,
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: alias.mnemonic,
            range,
            sortText: `1_${alias.mnemonic}`,
            filterText: alias.mnemonic,
          })
        }

        return {suggestions}
      },
    })

    return () => {
      provider.dispose()
    }
  }, [monaco, editorRef, editorReady, enabled])
}
