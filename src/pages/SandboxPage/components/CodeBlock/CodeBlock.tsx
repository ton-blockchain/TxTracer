import styles from "./CodeBlock.module.css"

export interface CodeBlockProps {
  readonly title?: string
  readonly content: string | undefined | null
  readonly variant?: "assembly" | "hex" | "inline"
  readonly placeholder?: string
  readonly className?: string
}

export function CodeBlock({
  title,
  content,
  variant = "hex",
  placeholder,
  className,
}: CodeBlockProps) {
  const displayContent = content ?? placeholder ?? "No content available"

  //   if (variant === "inline") {
  //     return (
  //       <code className={`${styles.content} ${styles.contentInline} ${className ?? ""}`}>
  //         {displayContent}
  //       </code>
  //     )
  //   }

  const contentClassName =
    variant === "assembly"
      ? `${styles.content} ${styles.contentAssembly}`
      : `${styles.content} ${styles.contentHex}`

  return (
    <div className={`${styles.container} ${className ?? ""}`}>
      {title && <div className={styles.title}>{title}</div>}
      <div className={contentClassName}>{displayContent}</div>
    </div>
  )
}
