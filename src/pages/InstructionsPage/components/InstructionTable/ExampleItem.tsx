import React from "react"
import {FaExclamationTriangle, FaPlay} from "react-icons/fa"

import ReactMarkdown, {type Components} from "react-markdown"

import type {Example, ExitCode} from "@features/spec/tvm-specification.types.ts"
import type {StackEntry} from "@features/spec/signatures/stack-signatures-schema.ts"

import {HighlightedAssembly} from "./HighlightedAssembly"

import StackDisplay from "./StackDisplay"

import styles from "./ExampleItem.module.css"

const convertStringsToStackEntries = (strings: readonly string[]): StackEntry[] => {
  return strings.map((str, index) => {
    const numValue = parseFloat(str)
    if (!isNaN(numValue) && isFinite(numValue)) {
      return {
        type: "const" as const,
        value_type: "Int" as const,
        value: numValue,
      }
    }

    const lowerStr = str.toLowerCase()

    if (lowerStr.includes("continuation") || lowerStr === "cont") {
      return {
        type: "simple" as const,
        name: `cont${index}`,
        value_types: ["Continuation"],
      }
    }

    if (lowerStr.includes("cell")) {
      return {
        type: "simple" as const,
        name: `cell${index}`,
        value_types: ["Cell"],
      }
    }

    if (lowerStr.includes("slice")) {
      return {
        type: "simple" as const,
        name: `slice${index}`,
        value_types: ["Slice"],
      }
    }

    if (lowerStr.includes("builder")) {
      return {
        type: "simple" as const,
        name: `builder${index}`,
        value_types: ["Builder"],
      }
    }

    if (lowerStr.includes("tuple")) {
      return {
        type: "simple" as const,
        name: `tuple${index}`,
        value_types: ["Tuple"],
      }
    }

    return {
      type: "const" as const,
      value_type: "Null" as const,
      value: null,
    }
  })
}

function stringToHex(str: string): string {
  return Array.from(str)
    .map(char => char.charCodeAt(0).toString(16).padStart(2, "0"))
    .join("")
}

const generatePlaygroundUrl = (example: Example): string => {
  const code = example.instructions.map(instr => instr.instruction).join("\n")
  const encodedCode = stringToHex(code)
  return `https://txtracer.ton.org/play/#lang=tasm&code=${encodedCode}`
}

interface ExampleItemProps {
  readonly example: Example
  readonly exitCodes?: readonly ExitCode[]
  readonly markdownComponents: Components
}

const ExampleItem: React.FC<ExampleItemProps> = ({
  example,
  exitCodes,
  markdownComponents,
}: ExampleItemProps) => {
  const isExceptional = example.exit_code !== undefined && example.exit_code !== 0
  let exitCondition = ""
  if (isExceptional && exitCodes) {
    const foundExit = exitCodes.find(ec => parseInt(ec.errno, 10) === example.exit_code)
    if (foundExit) {
      exitCondition = foundExit.condition
    }
  }

  const playgroundUrl = generatePlaygroundUrl(example)

  const code = example.instructions
    .map(instr => (instr.comment ? `${instr.instruction} // ${instr.comment}` : instr.instruction))
    .join("\n")

  return (
    <div className={`${styles.exampleItem} ${isExceptional ? styles.exampleItemError : ""}`}>
      {isExceptional && (
        <div className={styles.exampleErrorHeader}>
          <span className={styles.errorIcon}>
            <FaExclamationTriangle />
          </span>
          <span>Leads to Exit Code: {example.exit_code}</span>
          {exitCondition && (
            <p className={styles.errorConditionText}>
              Condition:{" "}
              <ReactMarkdown components={markdownComponents}>{exitCondition}</ReactMarkdown>
            </p>
          )}
        </div>
      )}

      <div className={styles.exampleInstructions}>
        <div className={styles.codeBlockContainer}>
          <pre className={styles.codeBlock}>
            <HighlightedAssembly code={code} />
          </pre>
        </div>
      </div>

      <div className={styles.exampleStack}>
        <div className={styles.stackHalf}>
          <h5 className={styles.exampleStructTitle}>Stack Input</h5>
          <div className={styles.stackDisplayContainer}>
            <StackDisplay items={convertStringsToStackEntries(example.stack.input)} />
          </div>
        </div>
        <div className={styles.stackHalf}>
          <h5 className={styles.exampleStructTitle}>Stack Output</h5>
          <div className={styles.stackDisplayContainer}>
            <StackDisplay items={convertStringsToStackEntries(example.stack.output)} />
          </div>
        </div>
      </div>

      <a
        href={playgroundUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.playgroundLink}
        title="Try in Playground"
      >
        <FaPlay className={styles.playIcon} />
        Open in Playground
      </a>
    </div>
  )
}

export default ExampleItem
