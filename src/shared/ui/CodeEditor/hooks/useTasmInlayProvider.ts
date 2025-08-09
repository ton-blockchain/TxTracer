import {useEffect} from "react"
import type * as monacoTypes from "monaco-editor"

import {TASM_LANGUAGE_ID} from "../languages"

interface UseTasmInlayProviderOptions {
  readonly monaco: typeof monacoTypes | null
  readonly implicitRetLine?: number
  readonly implicitRetLabel?: string
  readonly editorReady: boolean
  readonly enabled?: boolean
}

export const useTasmInlayProvider = ({
  monaco,
  implicitRetLine,
  implicitRetLabel,
  editorReady,
  enabled,
}: UseTasmInlayProviderOptions): void => {
  useEffect(() => {
    if (!monaco || !editorReady || !enabled) return

    const provider = monaco.languages.registerInlayHintsProvider(TASM_LANGUAGE_ID, {
      displayName: "TxTracer Inlays",
      provideInlayHints(model) {
        const hints: monacoTypes.languages.InlayHint[] = []
        if (implicitRetLine !== undefined) {
          const line = Math.min(Math.max(implicitRetLine + 1, 1), model.getLineCount())
          hints.push({
            label: implicitRetLabel ?? "↵ implicit RET",
            position: {lineNumber: line, column: model.getLineLength(line) + 1},
            kind: monaco.languages.InlayHintKind.Type,
            tooltip: "Implicit return from a continuation",
            paddingLeft: true,
            paddingRight: true,
          })
        }
        return {hints, dispose() {}}
      },
    })

    return () => {
      provider.dispose()
    }
  }, [monaco, implicitRetLine, implicitRetLabel, editorReady, enabled])
}
