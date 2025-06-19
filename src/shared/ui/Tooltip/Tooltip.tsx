import {type ReactNode, useState} from "react"
import ReactMarkdown from "react-markdown"

import styles from "./Tooltip.module.css"

interface TooltipProps {
  readonly children: ReactNode
  readonly content: ReactNode | string
  readonly variant?: "hover" | "positioned"
  readonly position?: {x: number; y: number}
  readonly enableMarkdown?: boolean
}

function renderContent(content: ReactNode | string, enableMarkdown: boolean) {
  if (enableMarkdown && typeof content === "string") {
    return (
      <ReactMarkdown
        components={{
          a: ({href, children}) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className={styles.link}>
              {children}
            </a>
          ),
          p: ({children}) => <div className={styles.paragraph}>{children}</div>,
          strong: ({children}) => <strong className={styles.strong}>{children}</strong>,
        }}
      >
        {content}
      </ReactMarkdown>
    )
  }
  return content
}

export function Tooltip({
  children,
  content,
  variant = "hover",
  position,
  enableMarkdown = false,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)

  if (variant === "positioned" && position) {
    return (
      <div
        className={styles.tooltipPositioned}
        style={{
          left: Math.max(10, Math.min(position.x - 80, window.innerWidth - 280)),
          top: Math.max(10, position.y - 265),
        }}
      >
        {renderContent(content, enableMarkdown)}
      </div>
    )
  }

  return (
    <div
      className={styles.triggerContainer}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && <div className={styles.tooltip}>{renderContent(content, enableMarkdown)}</div>}
    </div>
  )
}
