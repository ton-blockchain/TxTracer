import {Address, Cell, type ExternalAddress} from "@ton/core"

import type {TraceInfo} from "ton-assembly-test-dev/dist/trace"
import {compileCellWithMapping, decompileCell} from "ton-assembly-test-dev/dist/runtime/instr"
import {parse, print} from "ton-assembly-test-dev/dist/text"
import {createMappingInfo} from "ton-assembly-test-dev/dist/trace/mapping"
import {createTraceInfoPerTransaction} from "ton-assembly-test-dev/dist/trace/trace"

import React from "react"
import type {Maybe} from "@ton/core/dist/utils/maybe"

import {type ExitCode, findExitCode} from "@features/txTrace/lib/traceTx.ts"
import type {
  ContractData,
  ContractLetter,
} from "@app/pages/SandboxPage/SandboxPage.tsx"
import styles from "@app/pages/SandboxPage/SandboxPage.module.css"
import {
  bigintToAddress,
  findOpcodeAbi,
  type ParsedSlice,
  parseSliceWithAbiType,
} from "@app/pages/SandboxPage/common.ts"
import {ContractChip, OpcodeChip} from "@app/pages/SandboxPage/components"
import {formatCurrency} from "@shared/lib/format"
import type {TransactionInfo} from "@features/sandbox/lib/transaction.ts"

const formatAddress = (
  address: Address | Maybe<ExternalAddress> | undefined,
  contractLetters: Map<string, ContractLetter>,
): React.ReactNode => {
  if (!address) {
    return <ContractChip address={undefined} contractLetters={contractLetters} />
  }

  return <ContractChip address={address.toString()} contractLetters={contractLetters} />
}

export function TransactionShortInfo({
  tx,
  contracts,
  contractLetters,
}: {
  tx: TransactionInfo
  contracts: Map<string, ContractData>
  contractLetters: Map<string, ContractLetter>
}) {
  if (tx.transaction.description.type !== "generic") {
    throw new Error(
      "TxTracer doesn't support non-generic transaction. Given type: " +
        tx.transaction.description.type,
    )
  }

  const computePhase = tx.transaction.description.computePhase
  const computeInfo =
    computePhase.type === "skipped"
      ? "skipped"
      : {
          success: computePhase.success,
          exitCode:
            computePhase.exitCode === 0
              ? (tx.transaction.description.actionPhase?.resultCode ?? 0)
              : computePhase.exitCode,
          vmSteps: computePhase.vmSteps,
          gasUsed: computePhase.gasUsed,
          gasFees: computePhase.gasFees,
        }

  const vmLogs = tx.fields["vmLogs"] as string

  let steps = ""
  const thisAddress = bigintToAddress(tx?.transaction?.address)
  if (thisAddress) {
    const contract = contracts.get(thisAddress.toString())
    if (contract?.stateInit?.code) {
      const {traceInfo} = extractCodeAndTrace(contract?.stateInit?.code, vmLogs)

      steps = traceInfo?.steps?.map(it => it.instructionName).join(" ")
    }
  }

  // for (const [, value] of tx.transaction.outMessages) {
  //   if (value.init) {
  //     const contract = [...contracts.values()].find(
  //       it =>
  //         it.stateInit?.code?.toBoc()?.toString("hex") ===
  //         value.init?.code?.toBoc()?.toString("hex"),
  //     )
  //
  //     const address = contractAddress(0, value.init)
  //     console.log(value)
  //     console.log(address.toString())
  //     console.log(contract?.meta?.wrapperName)
  //   }
  // }

  const value =
    tx.transaction.inMessage?.info?.type === "internal"
      ? tx.transaction.inMessage?.info.value?.coins
      : undefined

  let opcode: number | undefined = undefined
  const slice = tx.transaction.inMessage?.body?.asSlice()
  if (slice && slice.remainingBits >= 32) {
    opcode = slice.loadUint(32)
  }

  let inMsgBodyParsed: Record<string, ParsedSlice> | undefined = undefined

  const abiType = findOpcodeAbi(tx, contracts, opcode)

  if (thisAddress) {
    const contract = contracts.get(thisAddress.toString())
    if (contract?.meta?.abi) {
      if (slice && abiType) {
        inMsgBodyParsed = parseSliceWithAbiType(slice, abiType, contract?.meta?.abi.types ?? [])
      }
    }
  }

  const formatBoolean = (v: boolean) => (
    <span className={v ? styles.booleanTrue : styles.booleanFalse}>{v ? "Yes" : "No"}</span>
  )

  return (
    <div className={styles.transactionDetailsContainer}>
      <div className={styles.transactionHeader}>
        <span>Transaction LT: {tx.transaction.lt.toString()}</span>
      </div>

      <div className={styles.detailRow}>
        <div className={styles.detailLabel}>Contract</div>
        <div className={styles.detailValue}>{formatAddress(thisAddress, contractLetters)}</div>
      </div>

      <div className={styles.detailRow}>
        <div className={styles.detailLabel}>Message Route</div>
        <div className={styles.detailValue}>
          {formatAddress(tx.transaction.inMessage?.info?.src, contractLetters)}
          {" → "}
          {formatAddress(tx.transaction.inMessage?.info?.dest, contractLetters)}
        </div>
      </div>

      <div className={styles.detailRow}>
        <div className={styles.detailLabel}>With Init</div>
        <div className={styles.detailValue}>{formatBoolean(!!tx.transaction.inMessage?.init)}</div>
      </div>

      {value && (
        <div className={styles.detailRow}>
          <div className={styles.detailLabel}>Value</div>
          <div className={styles.detailValue}>{formatCurrency(value)}</div>
        </div>
      )}

      <div className={styles.detailRow}>
        <div className={styles.detailLabel}>Out Messages</div>
        <div className={styles.detailValue}>
          <span className={styles.numberValue}>{tx.transaction.outMessagesCount}</span>
        </div>
      </div>

      <div className={styles.labeledSectionRow}>
        <div className={styles.labeledSectionTitle}>Message Data</div>
        <div className={styles.labeledSectionContent}>
          <div className={styles.multiColumnRow}>
            <div className={styles.multiColumnItem}>
              <div className={styles.multiColumnItemTitle}>Opcode</div>
              <div className={styles.multiColumnItemValue}>
                <OpcodeChip opcode={opcode} abiName={abiType?.name} />
              </div>
            </div>
          </div>
          {inMsgBodyParsed && (
            <div style={{marginTop: "var(--spacing-sm)"}}>
              <div className={styles.multiColumnItemTitle}>Parsed Data:</div>
              <div style={{marginLeft: "var(--spacing-sm)"}}>
                {showRecordValues(inMsgBodyParsed, contractLetters)}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={styles.labeledSectionRow}>
        <div className={styles.labeledSectionTitle}>Compute Phase</div>
        <div className={styles.labeledSectionContent}>
          {computeInfo === "skipped" ? (
            <div className={styles.multiColumnItemValue}>Skipped</div>
          ) : (
            <div className={styles.multiColumnRow}>
              <div className={styles.multiColumnItem}>
                <div className={styles.multiColumnItemTitle}>Success</div>
                <div className={styles.multiColumnItemValue}>
                  {formatBoolean(computeInfo?.success ?? false)}
                </div>
              </div>
              <div className={styles.multiColumnItem}>
                <div className={styles.multiColumnItemTitle}>Exit Code</div>
                <div className={`${styles.multiColumnItemValue} ${styles.numberValue}`}>
                  {computeInfo?.exitCode}
                </div>
              </div>
              <div className={styles.multiColumnItem}>
                <div className={styles.multiColumnItemTitle}>VM Steps</div>
                <div className={`${styles.multiColumnItemValue} ${styles.numberValue}`}>
                  {computeInfo?.vmSteps}
                </div>
              </div>
              <div className={styles.multiColumnItem}>
                <div className={styles.multiColumnItemTitle}>Gas Used</div>
                <div className={`${styles.multiColumnItemValue} ${styles.gasValue}`}>
                  {computeInfo?.gasUsed}
                </div>
              </div>
              <div className={styles.multiColumnItem}>
                <div className={styles.multiColumnItemTitle}>Gas Fees</div>
                <div className={`${styles.multiColumnItemValue} ${styles.gasValue}`}>
                  {formatCurrency(computeInfo?.gasFees)}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {steps && (
        <div className={styles.detailRow}>
          <div className={styles.detailLabel}>Execution Steps</div>
          <div className={styles.detailValue}>
            <div className={styles.codeBlock}>
              {steps.slice(0, Math.min(200, steps.length))}
              {steps.length > 200 && "..."}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function extractCodeAndTrace(
  codeCell: Cell | undefined,
  vmLogs: string,
): {
  code: string
  exitCode?: ExitCode
  traceInfo: TraceInfo
} {
  if (!codeCell) {
    return {code: "// No executable code found", traceInfo: {steps: []}}
  }

  const instructions = decompileCell(codeCell)
  const code = print(instructions)

  const instructionsWithPositions = parse("out.tasm", code)
  if (instructionsWithPositions.$ === "ParseFailure") {
    return {code: code, traceInfo: {steps: []}, exitCode: undefined}
  }

  const [, mapping] = compileCellWithMapping(instructionsWithPositions.instructions)
  const mappingInfo = createMappingInfo(mapping)
  const traceInfo = createTraceInfoPerTransaction(vmLogs, mappingInfo, undefined)[0]

  const exitCode = findExitCode(vmLogs, mappingInfo)
  if (exitCode === undefined) {
    return {code, exitCode: undefined, traceInfo}
  }

  return {code, exitCode, traceInfo}
}

function showRecordValues(
  data: Record<string, ParsedSlice>,
  contractLetters: Map<string, ContractLetter>,
) {
  return (
    <>
      {Object.entries(data).map(([key, value]) => (
        <div key={key}>
          &nbsp;&nbsp;&nbsp;{key.toString()}
          {": "}
          {value instanceof Address ? (
            <ContractChip address={value.toString()} contractLetters={contractLetters} />
          ) : value &&
            typeof value === "object" &&
            "$" in value &&
            value.$ === "sub-object" &&
            value.value ? (
            showRecordValues(value.value, contractLetters)
          ) : (
            // eslint-disable-next-line @typescript-eslint/no-base-to-string
            value?.toString()
          )}
        </div>
      ))}
    </>
  )
}
