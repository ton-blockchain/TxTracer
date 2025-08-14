import React, {Fragment} from "react"

import ReactMarkdown from "react-markdown"

import {calculateGasConsumption, infoOf} from "ton-assembly/dist/generator/instructions"

import type {TvmSpec, Instruction} from "@features/spec/tvm-specification.types"

import {useProcessedMarkdown} from "../../hooks/useProcessedMarkdown"

import {prettySubCategoryName} from "../../lib/formatCategory"

import InstructionDetail from "./InstructionDetail"
import StackDisplay from "./StackDisplay"

import styles from "./InstructionTable.module.css"
import {formatGasRanges} from "./utils.ts"

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
  readonly instructions: TvmSpec["instructions"]
  readonly expandedRows: Record<string, boolean>
  readonly onRowClick: (instructionName: string) => void
  readonly groupByCategory?: boolean
  readonly emptyState?: React.ReactNode
}

const InstructionTable: React.FC<InstructionTableProps> = ({
  instructions,
  expandedRows,
  onRowClick,
  groupByCategory = false,
  emptyState,
}: InstructionTableProps) => {
  const instructionEntries = Object.entries(instructions)

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
        {instructionEntries.slice(0, 100).map(([name, instruction], idx) => {
          const opcode = infoOf(name)
          if (!opcode) return null

          const gas = calculateGasConsumption(opcode)
          const isExpanded = expandedRows[name]
          const inputs = instruction.signature.inputs?.stack
          const outputs = instruction.signature.outputs?.stack

          const displayedOperands = instruction.operands || instruction.description.operands

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
                </div>
                <div className={`${styles.divTd} ${styles.nameColumn}`} role="cell">
                  {name}
                  {displayedOperands && displayedOperands.length > 0 && (
                    <span className={styles.operandsDisplay}>
                      {" ["}
                      {displayedOperands.join(" ")}
                      {"]"}
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
                    <InstructionDetail instruction={instruction} instructionName={name} />
                  </div>
                </div>
              )}
            </Fragment>
          )
        })}
      </div>
    </div>
  )
}

export default InstructionTable
