import * as monaco from "monaco-editor"

import styles from "./CompilerErrors.module.css"

interface CompilerErrorsProps {
  readonly markers: monaco.editor.IMarkerData[]
  readonly onNavigate?: (line: number, column: number) => void
  readonly filename: string
}

export default function CompilerErrors({markers, onNavigate, filename}: CompilerErrorsProps) {
  if (!markers.length) return null
  return (
    <div className={styles.container} role="status" aria-live="polite">
      <ul className={styles.list}>
        {markers.map((m, idx) => (
          <li key={`${m.startLineNumber}-${m.startColumn}-${idx}`} className={styles.item}>
            <button
              type="button"
              className={styles.link}
              onClick={() => onNavigate?.(m.startLineNumber, m.startColumn)}
            >
              <span className={styles.mono}>
                {filename}:{m.startLineNumber}:{m.startColumn}
              </span>
            </button>{" "}
            <span className={markerClassName(m.severity)}>{m.message}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function markerClassName(severity: monaco.MarkerSeverity): string {
  switch (severity) {
    case monaco.MarkerSeverity.Error:
      return styles.error
    case monaco.MarkerSeverity.Warning:
      return styles.warning
    case monaco.MarkerSeverity.Info:
    case monaco.MarkerSeverity.Hint:
      return styles.info
    default:
      return styles.error
  }
}
