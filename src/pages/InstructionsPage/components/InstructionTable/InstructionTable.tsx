import React, {Fragment} from "react"

import ReactMarkdown from "react-markdown"

import {
  calculateGasConsumptionWithDescription,
  infoOf,
} from "ton-assembly/dist/generator/instructions"

import type {Instruction, FiftInstruction} from "@features/spec/tvm-specification.types"

import {useProcessedMarkdown} from "../../hooks/useProcessedMarkdown"
import {prettySubCategoryName} from "../../lib/formatCategory"

import {AnchorButton} from "./AnchorButton"

import InstructionDetail from "./InstructionDetail"
import FiftInstructionDetail from "./FiftInstructionDetail"
import StackDisplay from "./StackDisplay"
import InlineOperand from "./InlineOperand"

import styles from "./InstructionTable.module.css"
import {formatGasRanges} from "./utils.ts"

type ExtendedInstruction = Instruction & {
  readonly isFift?: boolean
  readonly fiftName?: string
  readonly actualInstruction?: Instruction
  readonly fiftInstruction?: FiftInstruction
}

interface DescriptionCellProps {
  readonly instruction: Instruction
}

const DescriptionCell: React.FC<DescriptionCellProps> = ({instruction}: DescriptionCellProps) => {
  const markdownComponents = useProcessedMarkdown(instruction)
  const shortDescription = instruction.description.short
    ? instruction.description.short
    : (instruction.description.long ?? "")

  return <ReactMarkdown components={markdownComponents}>{shortDescription}</ReactMarkdown>
}

interface InstructionTableProps {
  readonly instructions: Record<string, ExtendedInstruction>
  readonly expandedRows: Record<string, boolean>
  readonly onRowClick: (instructionName: string) => void
  readonly groupByCategory?: boolean
  readonly emptyState?: React.ReactNode
  readonly limit?: number
  readonly totalCount?: number
  readonly onShowMore?: () => void
}

const InstructionTable: React.FC<InstructionTableProps> = ({
  instructions,
  expandedRows,
  onRowClick,
  groupByCategory = false,
  emptyState,
  limit = 100,
  totalCount,
  onShowMore,
}: InstructionTableProps) => {
  const instructionEntries = Object.entries(instructions)
  const shownCount = Math.min(instructionEntries.length, limit)

  return (
    <div className={styles.divTable} role="table">
      <div className={styles.divThead} role="rowgroup">
        <div className={styles.divTr} role="row">
          <div className={`${styles.divTh} ${styles.opcodeColumn}`} role="columnheader">
            Opcode
          </div>
          <div className={`${styles.divTh} ${styles.nameColumn}`} role="columnheader">
            Instruction Name
          </div>
          <div className={`${styles.divTh} ${styles.gasColumn}`} role="columnheader">
            Gas
          </div>
          <div className={`${styles.divTh} ${styles.descriptionColumn}`} role="columnheader">
            Description
          </div>
          <div className={`${styles.divTh} ${styles.stackColumn}`} role="columnheader">
            Stack
            {typeof totalCount === "number" && (
              <span className={styles.shownCountBadge} aria-label="Shown instructions count">
                Shown {shownCount} out of {instructionEntries.length}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className={styles.divTbody} role="rowgroup">
        {instructionEntries.length === 0 && emptyState && (
          <div className={styles.divTrExpanded} role="row">
            <div className={`${styles.divTd} full ${styles.emptyStateCell}`} role="cell">
              {emptyState}
            </div>
          </div>
        )}
        {instructionEntries.slice(0, shownCount).map(([name, instruction], idx) => {
          const instructionName =
            instruction.isFift && instruction.fiftInstruction
              ? instruction.fiftInstruction.actual_name
              : name
          const opcode = infoOf(instructionName)
          if (!opcode) return null

          const gas = instruction.description.gas ?? calculateGasConsumptionWithDescription(opcode)
          const isExpanded = expandedRows[name]
          const inputs = instruction.signature.inputs?.stack
          const outputs = instruction.signature.outputs?.stack

          let displayedOperands = instruction.operands ?? instruction.description.operands
          if (instruction.isFift && instruction.fiftInstruction) {
            const fiftArgsCount = instruction.fiftInstruction.arguments?.length || 0
            const originalOperandsCount = displayedOperands?.length || 0
            if (fiftArgsCount === originalOperandsCount) {
              displayedOperands = [] // Hide inline operands
            }
          }

          const currentCategory = String(instruction.category ?? "")
          const prevCategory =
            idx > 0 ? String(instructionEntries[idx - 1][1].category ?? "") : null
          const shouldShowGroupHeader = groupByCategory && currentCategory !== prevCategory

          return (
            <Fragment key={name}>
              {shouldShowGroupHeader && (
                <div className={styles.divTrExpanded} role="row">
                  <div className={`${styles.divTd} full ${styles.groupHeaderCell}`} role="cell">
                    {prettySubCategoryName(currentCategory)}
                  </div>
                </div>
              )}
              <div
                id={name}
                onClick={() => onRowClick(name)}
                onKeyDown={e => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    onRowClick(name)
                  }
                }}
                tabIndex={0}
                className={`${styles.divTr} ${styles.tableRow} ${isExpanded ? styles.expandedRowHeader : ""}`}
                role="row"
                aria-expanded={isExpanded}
              >
                <div className={`${styles.divTd} ${styles.opcodeColumn}`} role="cell">
                  {instruction.layout.prefix_str}
                  <AnchorButton
                    className={"anchorButton"}
                    value={name}
                    title={`Copy anchor link to ${name}`}
                  />
                </div>
                <div className={`${styles.divTd} ${styles.nameColumn}`} role="cell">
                  {name}
                  {displayedOperands && displayedOperands.length > 0 && (
                    <span className={styles.operandsDisplay}>
                      {displayedOperands.map((_, opIdx) => (
                        <InlineOperand
                          instructionName={instructionName}
                          key={opIdx}
                          instruction={instruction}
                          operandIndex={opIdx}
                          inDetails={false}
                        />
                      ))}
                    </span>
                  )}
                </div>
                <div className={`${styles.divTd} ${styles.gasColumn}`} role="cell">
                  {formatGasRanges(gas)}
                </div>
                <div className={`${styles.divTd} ${styles.descriptionColumn}`} role="cell">
                  <DescriptionCell instruction={instruction} />
                </div>
                <div className={`${styles.divTd} ${styles.stackColumnCell}`} role="cell">
                  <div className={styles.stackInternalTwoColumnLayout}>
                    <div className={styles.stackInternalInputColumn}>
                      <StackDisplay items={inputs ?? []} />
                    </div>
                    <div className={styles.stackInternalOutputColumn}>
                      <StackDisplay items={outputs ?? []} />
                    </div>
                  </div>
                </div>
              </div>
              {isExpanded && (
                <div className={styles.divTrExpanded} role="row">
                  <div
                    className={`${styles.divTd} full ${styles.instructionDetailCell}`}
                    role="cell"
                  >
                    {instruction.isFift &&
                    instruction.fiftName &&
                    instruction.actualInstruction &&
                    instruction.fiftInstruction ? (
                      <FiftInstructionDetail
                        fiftName={instruction.fiftName}
                        fiftInstruction={instruction.fiftInstruction}
                        actualInstruction={instruction.actualInstruction}
                      />
                    ) : (
                      <InstructionDetail instruction={instruction} instructionName={name} />
                    )}
                  </div>
                </div>
              )}
            </Fragment>
          )
        })}
        {instructionEntries.length > shownCount && onShowMore && (
          <div className={styles.divTrExpanded} role="row">
            <div className={`${styles.divTd} ${styles.divTdNoPadding} full`} role="cell">
              <div
                className={styles.loadMoreCell}
                onClick={onShowMore}
                onKeyDown={e => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    onShowMore()
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label="Show more instructions"
              >
                Show more instructions
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default InstructionTable
