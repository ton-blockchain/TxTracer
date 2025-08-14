import React from "react"
import {FaExclamationTriangle} from "react-icons/fa"

import ReactMarkdown from "react-markdown"

import {calculateGasConsumption, infoOf} from "ton-assembly/dist/generator/instructions"

import type {Instruction} from "@features/spec/tvm-specification.types"

import {prettyCategoryName} from "@app/pages/InstructionsPage/lib/formatCategory.ts"

import {useProcessedMarkdown} from "../../hooks/useProcessedMarkdown"

import styles from "./InstructionDetail.module.css"
import {formatGasRanges} from "./utils.ts"

interface InstructionDetailProps {
  readonly instruction: Instruction
  readonly instructionName: string
}

const InstructionDetail: React.FC<InstructionDetailProps> = ({
  instruction,
  instructionName,
}: InstructionDetailProps) => {
  const {description, layout, category} = instruction
  const version = layout.version ?? 0

  const opcodeInfo = infoOf(instructionName)
  const gasConsumption = opcodeInfo ? calculateGasConsumption(opcodeInfo) : []
  const formattedGas = formatGasRanges(gasConsumption)

  const displayedOperands = instruction.operands ?? description.operands

  const markdownComponents = useProcessedMarkdown(instruction)

  return (
    <div className={styles.detailContainer}>
      <div className={styles.detailHeader}>
        <h2 className={styles.instructionName}>
          {instructionName}
          {displayedOperands && displayedOperands.length > 0 && (
            <span className={styles.operandsDisplay}>
              {" ["}
              {displayedOperands.join(" ")}
              {"]"}
            </span>
          )}
          <span className={styles.opcode}>{layout.prefix_str}</span>
        </h2>

        <div className={styles.metadataContainer}>
          <div className={styles.metadataItem}>
            <span className={styles.metadataLabel}>Since Version:</span>
            <span className={styles.metadataValue}>{version}</span>
          </div>
          <div className={styles.metadataItem}>
            <span className={styles.metadataLabel}>Category:</span>
            <span className={styles.metadataValue}>{prettyCategoryName(category)}</span>
          </div>
          <div className={styles.metadataItem}>
            <span className={styles.metadataLabel}>Gas:</span>
            <span className={styles.metadataValue}>{formattedGas}</span>
          </div>
          {description.tags && description.tags.length > 0 && (
            <div className={styles.metadataItem}>
              <span className={styles.metadataLabel}>Tags:</span>
              <span className={styles.metadataValue}>
                {description.tags.map((tag, index) => (
                  <span key={index} className={styles.tagPill}>
                    #{tag}
                  </span>
                ))}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className={styles.detailSection}>
        <div className={styles.descriptionText}>
          <ReactMarkdown components={markdownComponents}>{description.long}</ReactMarkdown>
          {description.short && description.short !== description.long && (
            <ReactMarkdown components={markdownComponents}>{description.short}</ReactMarkdown>
          )}
        </div>
      </div>

      {description.other_implementations && description.other_implementations.length > 0 && (
        <div className={styles.detailSection}>
          <h3 className={styles.detailSectionTitle}>Other Implementations</h3>
          <ul className={`${styles.implementationsList} ${styles.implementationsGridContainer}`}>
            {description.other_implementations.map((impl, index) => (
              <li key={index} className={styles.implementationItem}>
                <span className={styles.implementationsHeader}>
                  {impl.exact ? "Exact Equivalent:" : "Approximately Equivalent:"}
                </span>
                <pre className={styles.codeBlock}>{impl.instructions.join("\n")}</pre>
              </li>
            ))}
          </ul>
        </div>
      )}

      {description.exit_codes && description.exit_codes.length > 0 && (
        <div className={styles.detailSection}>
          <h3 className={styles.detailSectionTitle}>Exit Codes</h3>
          <ul className={styles.exitCodeList}>
            {description.exit_codes.map((exitCode, index) => (
              <li key={index} className={styles.exitCodeItem}>
                <span className={styles.exitCodeErrno}>{exitCode.errno}:</span>
                <span className={styles.exitCodeCondition}>
                  <ReactMarkdown components={markdownComponents}>
                    {exitCode.condition}
                  </ReactMarkdown>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {description.examples && description.examples.length > 0 && (
        <div className={styles.detailSection}>
          <h3 className={styles.detailSectionTitle}>Examples</h3>
          <div className={styles.examplesGridContainer}>
            {description.examples.map((example, index) => {
              const isExceptional = example.exit_code !== undefined && example.exit_code !== 0
              let exitCondition = ""
              if (isExceptional && description.exit_codes) {
                const foundExit = description.exit_codes.find(
                  ec => parseInt(ec.errno, 10) === example.exit_code,
                )
                if (foundExit) {
                  exitCondition = foundExit.condition
                }
              }

              return (
                <div
                  key={index}
                  className={`${styles.exampleItem} ${isExceptional ? styles.exampleItemError : ""}`}
                >
                  {isExceptional && (
                    <div className={styles.exampleErrorHeader}>
                      <span className={styles.errorIcon}>
                        <FaExclamationTriangle />
                      </span>
                      <span>Leads to Exit Code: {example.exit_code}</span>
                      {exitCondition && (
                        <p className={styles.errorConditionText}>
                          Condition:{" "}
                          <ReactMarkdown components={markdownComponents}>
                            {exitCondition}
                          </ReactMarkdown>
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
                            <div
                              key={i}
                              className={isPreparatory ? styles.preparatoryInstruction : ""}
                            >
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
                        {example.stack.input.map((item, i) => (
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
                        {example.stack.output.map((item, i) => (
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
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default InstructionDetail
