import React from "react"
import {FaExclamationTriangle} from "react-icons/fa"

import ReactMarkdown, {type Components} from "react-markdown"

import type {Example, ExitCode} from "@features/spec/tvm-specification.types.ts"

import styles from "./ExampleItem.module.css"

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
        <h5 className={styles.exampleStructTitle}>Instructions:</h5>
        <pre className={styles.codeBlock}>
          {(() => {
            const instructions = example.instructions
            const hasExplicitMain = instructions.some(instr => instr.is_main === true)

            return instructions.map((instr, i, arr) => {
              let isPreparatory = false
              if (hasExplicitMain) {
                isPreparatory = instr.is_main !== true
              } else {
                isPreparatory = i < arr.length - 1
              }

              return (
                <div key={i} className={isPreparatory ? styles.preparatoryInstruction : ""}>
                  <code>{instr.instruction}</code>
                  {instr.comment && (
                    <span
                      className={`${styles.comment} ${isPreparatory ? styles.preparatoryComment : ""}`}
                    >
                      {" # "}
                      {instr.comment}
                    </span>
                  )}
                </div>
              )
            })
          })()}
        </pre>
      </div>

      <div className={styles.exampleStack}>
        <div className={styles.stackHalf}>
          <h5 className={styles.exampleStructTitle}>Stack Input:</h5>
          <pre className={styles.codeBlock}>
            {[...example.stack.input].reverse().map((item, i) => (
              <div key={i}>
                <code>{item}</code>
              </div>
            ))}
            {example.stack.input.length === 0 && <span>(empty)</span>}
          </pre>
        </div>
        <div className={styles.stackHalf}>
          <h5 className={styles.exampleStructTitle}>Stack Output:</h5>
          <pre className={styles.codeBlock}>
            {[...example.stack.output].reverse().map((item, i) => (
              <div key={i}>
                <code>{item}</code>
              </div>
            ))}
            {example.stack.output.length === 0 && <span>(empty)</span>}
          </pre>
        </div>
      </div>
    </div>
  )
}

export default ExampleItem
