import * as monaco from "monaco-editor"

export interface ParsedError {
  readonly filename: string
  readonly line: number
  readonly column: number
  readonly message: string
  readonly severity: "error" | "warning" | "info"
}

export function parseFuncErrors(errorText: string): ParsedError[] {
  const errors: ParsedError[] = []

  // filename:line:column: error: message
  const errorRegex = /(\w+\.fc):(\d+):(\d+):\s*(error|warning|info):\s*(.+)/g

  let match: RegExpExecArray | null
  while ((match = errorRegex.exec(errorText)) !== null) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const [, filename, lineStr, columnStr, severityStr, message]: [
      string,
      string,
      string,
      string,
      "error" | "warning" | "info",
      string,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ] = match as any

    errors.push({
      filename,
      line: parseInt(lineStr, 10),
      column: parseInt(columnStr, 10),
      message: message.trim(),
      severity: severityStr,
    })
  }

  return errors
}

export function convertErrorsToMarkers(errors: ParsedError[]): monaco.editor.IMarkerData[] {
  return errors.map(error => ({
    severity: getSeverity(error.severity),
    startLineNumber: error.line,
    startColumn: error.column,
    endLineNumber: error.line,
    endColumn: error.column + 1,
    message: error.message,
    source: "FunC Compiler",
  }))
}

function getSeverity(severity: string): monaco.MarkerSeverity {
  switch (severity) {
    case "error":
      return monaco.MarkerSeverity.Error
    case "warning":
      return monaco.MarkerSeverity.Warning
    case "info":
      return monaco.MarkerSeverity.Info
    default:
      return monaco.MarkerSeverity.Error
  }
}
