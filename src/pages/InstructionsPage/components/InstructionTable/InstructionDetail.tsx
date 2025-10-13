import React from "react"

import ReactMarkdown from "react-markdown"

import {FiExternalLink} from "react-icons/fi"

import {Category, type DocsLink, type Instruction} from "@features/spec/tvm-specification.types"

import {prettySubCategoryName} from "@app/pages/InstructionsPage/lib/formatCategory.ts"

import {RegisterSquare} from "@app/pages/InstructionsPage/components/InstructionTable/RegisterSquare.tsx"

import type {Register} from "@features/spec/signatures/stack-signatures-schema.ts"

import {HighlightedAssembly} from "@app/pages/InstructionsPage/components/InstructionTable/HighlightedAssembly.tsx"

import {useProcessedMarkdown} from "../../hooks/useProcessedMarkdown"

import styles from "./InstructionDetail.module.css"
import {formatGasRanges} from "./utils.ts"
import InlineOperand from "./InlineOperand"
import OperandsView from "./OperandsView"
import ArithmeticCalculator from "./ArithmeticCalculator"
import ExampleItem from "./ExampleItem"

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

  const gasConsumption = instruction.description.gas ?? []
  const formattedGas = formatGasRanges(gasConsumption)

  const displayedOperands = instruction.operands ?? description.operands

  const markdownComponents = useProcessedMarkdown(instruction)

  const stackInputs = instruction.signature.inputs?.stack ?? []
  const needShowCalculator =
    instruction.category === Category.Arithmetic &&
    !instructionName.startsWith("PUSHINT_") &&
    stackInputs.every(input => input.type === "simple" && input.value_types?.[0] === "Int")

  const registerPresentation = (reg: Register) => {
    if (reg.type === "constant") {
      return <RegisterSquare key={reg.index} index={reg.index} />
    }
    if (reg.type === "variable") {
      return <RegisterSquare key={reg.var_name} variable={reg.var_name} />
    }
    return null
  }

  const inputRegisters = instruction.signature.inputs?.registers ?? []
  const outputRegisters = instruction.signature.outputs?.registers ?? []

  const links: DocsLink[] = []
  if (description.docs_links) {
    links.push(...description.docs_links)
  }

  return (
    <div className={styles.detailContainer}>
      <div className={styles.leftColumn}>
        <div className={styles.detailHeader}>
          <h2 className={styles.instructionName}>
            {instructionName}
            {displayedOperands && displayedOperands.length > 0 && (
              <span className={styles.operandsDisplay}>
                {displayedOperands.map((_, idx) => (
                  <InlineOperand
                    key={idx}
                    instructionName={instructionName}
                    instruction={instruction}
                    operandIndex={idx}
                    inDetails={true}
                  />
                ))}
              </span>
            )}
            <span className={styles.opcode}>{layout.prefix_str}</span>
          </h2>

          <div className={styles.metadataContainer}>
            <div className={styles.metadataItem}>
              <span className={styles.metadataLabel}>Since Version:</span>
              <span className={styles.metadataValue}>
                {version >= 4 ? (
                  <a
                    href={`https://github.com/ton-blockchain/ton/blob/master/doc/GlobalVersions.md#version-${version}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.versionLink}
                    title={`View TVM version ${version} documentation`}
                  >
                    {version}
                    <FiExternalLink />
                  </a>
                ) : (
                  version
                )}
              </span>
            </div>

            <div className={styles.metadataItem}>
              <span className={styles.metadataLabel}>Category:</span>
              <span className={styles.metadataValue}>{prettySubCategoryName(category)}</span>
            </div>
            <div className={styles.metadataItem}>
              <span className={styles.metadataLabel}>Gas:</span>
              <span className={styles.metadataValue}>{formattedGas}</span>
            </div>

            {instruction.implementation && (
              <div className={styles.metadataItem}>
                <span className={styles.metadataLabel}>Implementation:</span>
                <span className={styles.metadataValue}>
                  <a
                    href={`https://github.com/ton-blockchain/ton/blob/${instruction.implementation.commit_hash}/${instruction.implementation.file_path}#L${instruction.implementation.line_number}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.implementationLink}
                  >
                    {instruction.implementation.file_path.split("/").pop()}:
                    {instruction.implementation.line_number}
                  </a>
                </span>
              </div>
            )}

            {inputRegisters.length > 0 && (
              <div className={styles.metadataItem}>
                <span className={styles.metadataLabel}>Read registers:</span>
                <span className={styles.metadataValue}>
                  {inputRegisters.map(reg => registerPresentation(reg))}
                </span>
              </div>
            )}

            {outputRegisters.length > 0 && (
              <div className={styles.metadataItem}>
                <span className={styles.metadataLabel}>Write registers:</span>
                <span className={styles.metadataValue}>
                  {outputRegisters.map(reg => registerPresentation(reg))}
                </span>
              </div>
            )}

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

        {gasConsumption.length > 1 && gasConsumption.length < 10 && (
          <div className={styles.detailSection}>
            <h3 className={styles.detailSectionTitle}>Gas Details</h3>
            <ul className={styles.exitCodeList}>
              {gasConsumption
                .filter(it => it.value !== 36)
                .sort((a, b) => a.value - b.value)
                .map((entry, idx) => (
                  <li key={idx} className={styles.exitCodeItem}>
                    <span className={styles.exitCodeErrno}>{entry.value}:</span>
                    <span className={styles.exitCodeCondition}>{entry.description}</span>
                  </li>
                ))}
            </ul>
          </div>
        )}

        <OperandsView instruction={instruction} />

        <div className={styles.detailSection}>
          <div className={styles.descriptionText}>
            {description.short && description.short !== description.long && (
              <ReactMarkdown components={markdownComponents}>{description.short}</ReactMarkdown>
            )}

            {description.long && (
              <>
                <h3 className={styles.detailSectionTitle}>Details</h3>
                <ReactMarkdown components={markdownComponents}>{description.long}</ReactMarkdown>
              </>
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
                  <div className={styles.implementationCode}>
                    <HighlightedAssembly code={impl.instructions.join("\n")} />
                  </div>
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
              {description.examples.map((example, index) => (
                <ExampleItem
                  key={index}
                  example={example}
                  exitCodes={description.exit_codes}
                  markdownComponents={markdownComponents}
                />
              ))}
            </div>
          </div>
        )}

        {links.length > 0 && (
          <div className={styles.detailSection}>
            <h3 className={styles.detailSectionTitle}>Documentation</h3>
            <div className={styles.linksContainer}>
              <ul className={styles.linksList}>
                {links.map((link, index) => (
                  <li key={index}>
                    <a href={link.url} target="_blank" rel="noopener noreferrer">
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      <div className={styles.rightColumn}>
        {needShowCalculator && (
          <ArithmeticCalculator instruction={instruction} instructionName={instructionName} />
        )}
      </div>
    </div>
  )
}

export default InstructionDetail
