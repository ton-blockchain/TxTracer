/* eslint-disable */
// @ts-nocheck
import React, {type JSX, useMemo} from "react"
import type {Components} from "react-markdown"

import type {Instruction} from "@features/spec/tvm-specification.types"

import ReferenceBubble from "../components/ReferenceBubble/ReferenceBubble"
import styles from "../components/InstructionTable/InstructionDetail.module.css"

const processTextForReferences = (
  text: string,
  instruction: Instruction,
  baseKey: string,
): (string | JSX.Element)[] => {
  if (!text) return [text]

  const regex = /\$([a-zA-Z0-9_]+)/g
  const parts: (string | JSX.Element)[] = []
  let lastIndex = 0
  let match
  let keyIndex = 0

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index))
    }
    const varName = match[1]
    parts.push(
      <ReferenceBubble
        key={`${baseKey}-ref-${varName}-${keyIndex++}`}
        name={varName}
        instruction={instruction}
      />,
    )
    lastIndex = regex.lastIndex
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex))
  }

  return parts.length > 0 ? parts : [text]
}

const transformChildren = (
  children: React.ReactNode,
  instruction: Instruction,
  keyPrefix: string,
): React.ReactNode => {
  let childKeyIndex = 0
  return React.Children.map(children, child => {
    const currentKey = `${keyPrefix}-${childKeyIndex++}`
    if (typeof child === "string") {
      return processTextForReferences(child, instruction, currentKey)
    }
    if (
      React.isValidElement(child) &&
      (child.props as HTMLElement).children &&
      typeof child.type === "string"
    ) {
      return React.cloneElement(child, {
        ...(child.props as HTMLElement),
        children: transformChildren(child.props.children, instruction, currentKey),
      })
    }
    return child
  })
}

export const useProcessedMarkdown = (instruction: Instruction | undefined): Components => {
  return useMemo(() => {
    if (!instruction) {
      // Return default components or empty if instruction is not available
      return {
        p: ({node, children, ...props}) => <p {...props}>{children}</p>,
        code: ({node, inline, className, children, ...props}) => (
          <code className={className} {...props}>
            {children}
          </code>
        ),
      }
    }

    return {
      p: ({node, children, ...props}) => {
        return (
          <p className={styles.markdownParagraph} {...props}>
            {transformChildren(children, instruction, "p")}
          </p>
        )
      },
      li: ({node, children, ...props}) => {
        return <li {...props}>{transformChildren(children, instruction, "li")}</li>
      },
      code: ({node, inline, className, children, ...props}) => {
        const textContent = React.Children.toArray(children)
          .map(c => (typeof c === "string" ? c : ""))
          .join("")
        const processedChildren = processTextForReferences(
          textContent,
          instruction,
          `md-code-${textContent.substring(0, 10)}`,
        )
        return (
          <code className={className} {...props}>
            {processedChildren}
          </code>
        )
      },
    }
  }, [instruction])
}
