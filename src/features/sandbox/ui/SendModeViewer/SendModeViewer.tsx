import {useState} from "react"
import ReactMarkdown from "react-markdown"

import {parseSendMode} from "@features/sandbox/lib/transaction.ts"

import styles from "./SendModeViewer.module.css"

interface SendModeViewerProps {
  readonly mode: number | undefined
}

export function SendModeViewer({mode}: SendModeViewerProps) {
  const [hoveredConstant, setHoveredConstant] = useState<string | null>(null)

  if (mode === undefined) {
    return <span className={styles.empty}>Unknown</span>
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
          <div
            className={styles.constantContainer}
            onMouseEnter={() => setHoveredConstant(flag.name)}
            onMouseLeave={() => setHoveredConstant(null)}
          >
            <span className={styles.constant}>
              {flag.name} ({flag.value})
            </span>
            {hoveredConstant === flag.name && (
              <div className={styles.tooltip}>
                <ReactMarkdown
                  components={{
                    a: ({href, children}) => (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.link}
                      >
                        {children}
                      </a>
                    ),
                    p: ({children}) => <div className={styles.paragraph}>{children}</div>,
                    strong: ({children}) => <strong className={styles.strong}>{children}</strong>,
                  }}
                >
                  {flag.description}
                </ReactMarkdown>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
