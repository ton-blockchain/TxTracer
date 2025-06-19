import {parseSendMode} from "@features/sandbox/lib/transaction.ts"
import {Tooltip} from "@shared/ui/Tooltip"

import styles from "./SendModeViewer.module.css"

interface SendModeViewerProps {
  readonly mode: number | undefined
}

export function SendModeViewer({mode}: SendModeViewerProps) {
  if (mode === undefined) {
    return <span className={styles.empty}>No mode</span>
  }

  const flags = parseSendMode(mode)

  if (flags.length === 0) {
    return <span className={styles.empty}>Unknown mode: {mode}</span>
  }

  return (
    <div className={styles.container}>
      {flags.map((flag, index) => (
        <div key={flag.value}>
          {index > 0 && <span className={styles.plus}> + </span>}
          <Tooltip content={flag.description} enableMarkdown={true}>
            <span className={styles.constant}>
              {flag.name} ({flag.value})
            </span>
          </Tooltip>
        </div>
      ))}
    </div>
  )
}
