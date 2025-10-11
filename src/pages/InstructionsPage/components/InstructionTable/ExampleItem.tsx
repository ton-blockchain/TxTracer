import React from "react"
import {FaExclamationTriangle, FaPlay} from "react-icons/fa"

import ReactMarkdown, {type Components} from "react-markdown"

import type {Example, ExitCode} from "@features/spec/tvm-specification.types.ts"
import type {StackEntry} from "@features/spec/signatures/stack-signatures-schema.ts"

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

interface Token {
  readonly type:
    | "instruction"
    | "register"
    | "control_register"
    | "number"
    | "comment"
    | "whitespace"
    | "other"
  readonly value: string
}

const tokenizeCode = (code: string): Token[] => {
  const tokens: Token[] = []
  let i = 0

  while (i < code.length) {
    const char = code[i]

    if (/\s/.test(char)) {
      let whitespace = char
      i++
      while (i < code.length && /\s/.test(code[i])) {
        whitespace += code[i]
        i++
      }
      tokens.push({type: "whitespace", value: whitespace})
      continue
    }

    if (char === "/" && code[i + 1] === "/") {
      const start = i
      i += 2
      while (i < code.length && code[i] !== "\n") {
        i++
      }
      tokens.push({type: "comment", value: code.slice(start, i)})
      continue
    }

    // Stack registers (s followed by digits)
    if (char === "s" && /^\d/.test(code[i + 1] || "")) {
      let register = char
      i++
      while (i < code.length && /\d/.test(code[i])) {
        register += code[i]
        i++
      }
      tokens.push({type: "register", value: register})
      continue
    }

    // Control registers (c followed by digits)
    if (char === "c" && /^\d/.test(code[i + 1] || "")) {
      let register = char
      i++
      while (i < code.length && /\d/.test(code[i])) {
        register += code[i]
        i++
      }
      tokens.push({type: "control_register", value: register})
      continue
    }

    if (char === "0" && code[i + 1] === "x") {
      // Hex number
      let number = char + code[i + 1]
      i += 2
      while (i < code.length && /[0-9a-fA-F]/.test(code[i])) {
        number += code[i]
        i++
      }
      tokens.push({type: "number", value: number})
      continue
    } else if (/\d/.test(char)) {
      // Decimal number
      let number = char
      i++
      while (i < code.length && /\d/.test(code[i])) {
        number += code[i]
        i++
      }
      tokens.push({type: "number", value: number})
      continue
    }

    if (/[A-Z]/.test(char)) {
      let instruction = char
      i++
      while (i < code.length && /[A-Z0-9_]/.test(code[i])) {
        instruction += code[i]
        i++
      }
      tokens.push({type: "instruction", value: instruction})
      continue
    }

    tokens.push({type: "other", value: char})
    i++
  }

  return tokens
}

const HighlightedAssembly: React.FC<{code: string}> = ({code}) => {
  const tokens = tokenizeCode(code)

  return (
    <code>
      {tokens.map((token, index) => {
        switch (token.type) {
          case "instruction":
            return (
              <span key={index} className={styles.tokenInstruction}>
                {token.value}
              </span>
            )
          case "register":
            return (
              <span key={index} className={styles.tokenRegister}>
                {token.value}
              </span>
            )
          case "control_register":
            return (
              <span key={index} className={styles.tokenControlRegister}>
                {token.value}
              </span>
            )
          case "number":
            return (
              <span key={index} className={styles.tokenNumber}>
                {token.value}
              </span>
            )
          case "comment":
            return (
              <span key={index} className={styles.tokenComment}>
                {token.value}
              </span>
            )
          case "whitespace":
            return <span key={index}>{token.value}</span>
          default:
            return <span key={index}>{token.value}</span>
        }
      })}
    </code>
  )
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
            {(() => {
              const instructions = example.instructions

              return instructions.map((instr, i) => {
                const fullCode = instr.comment
                  ? `${instr.instruction} // ${instr.comment}`
                  : instr.instruction

                return (
                  <div key={i}>
                    <HighlightedAssembly code={fullCode} />
                  </div>
                )
              })
            })()}
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
