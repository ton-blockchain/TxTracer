import React, {type JSX} from "react"

import type {TraceResult} from "txtracer-core/dist/types"

import AddressChip from "@shared/ui/AddressChip"
import StatusBadge, {type StatusType} from "@shared/ui/StatusBadge"
import {formatAddress, formatCurrency, formatNumber} from "@shared/lib/format"

import {ExitCodeChip} from "@features/common/ui/ExitCodeChip/ExitCodeChip.tsx"
import {OpcodeChip} from "@shared/ui/OpcodeChip/OpcodeChip.tsx"

import styles from "./TransactionDetailsTable.module.css"

export interface TransactionDetailsTableProps {
  readonly result: TraceResult
}

const formatDetailedTimestamp = (
  timestampInput: number | string | undefined,
): JSX.Element | string => {
  if (timestampInput === undefined) return "—"

  const date =
    typeof timestampInput === "string" ? new Date(timestampInput) : new Date(timestampInput * 1000)

  const pad = (num: number) => num.toString().padStart(2, "0")
  const monthAbbrs = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ]

  const day = date.getDate()
  const monthIndex = date.getMonth()
  const monthNum = monthIndex + 1
  const year = date.getFullYear()
  const hours = date.getHours()
  const minutes = date.getMinutes()
  const seconds = date.getSeconds()

  const fullPart = `${pad(day)}.${pad(monthNum)}.${year}, ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
  const shortPart = `${pad(day)} ${monthAbbrs[monthIndex]}, ${pad(hours)}:${pad(minutes)}`

  return (
    <>
      {fullPart}
      <span className={styles.timestampDetailSecondary}> — {shortPart}</span>
    </>
  )
}

const TransactionDetailsTable: React.FC<TransactionDetailsTableProps> = ({result}) => {
  const formatBoolean = (v: boolean) => (
    <span className={v ? styles.booleanTrue : styles.booleanFalse}>{v ? "Yes" : "No"}</span>
  )

  const tx = result.emulatedTx
  const money = result.money
  const isSuccess = tx.computeInfo !== "skipped" && tx.computeInfo.success
  const exitCode = tx.computeInfo !== "skipped" ? tx.computeInfo.exitCode : undefined
  const statusType: StatusType = isSuccess ? "success" : "failed"

  return (
    <div className={styles.transactionDetailsContainer}>
      <div className={styles.detailRow}>
        <div className={styles.detailLabel}>Status</div>
        <div className={styles.detailValue}>
          <StatusBadge type={statusType} exitCode={exitCode} />
        </div>
      </div>
      <div className={styles.detailRow}>
        <div className={styles.detailLabel}>Account</div>
        <div className={styles.detailValue}>
          <AddressChip address={formatAddress(result.inMsg.contract)} />
        </div>
      </div>
      {result.inMsg.sender && (
        <div className={styles.detailRow}>
          <div className={styles.detailLabel}>Sender</div>
          <div className={styles.detailValue}>
            <AddressChip address={formatAddress(result.inMsg.sender)} />
          </div>
        </div>
      )}
      <div className={styles.detailRow}>
        <div className={styles.detailLabel}>Time</div>
        <div className={`${styles.detailValue} ${styles.timestampValue}`}>
          {formatDetailedTimestamp(tx.utime)}
        </div>
      </div>
      <div className={styles.detailRow}>
        <div className={styles.detailLabel}>LT</div>
        <div className={`${styles.detailValue} ${styles.numberValue}`}>{String(tx.lt)}</div>
      </div>

      {result.inMsg.opcode && (
        <div className={styles.labeledSectionRow}>
          <div className={styles.labeledSectionTitle}>Message Data</div>
          <div className={styles.labeledSectionContent}>
            <div className={styles.multiColumnRow}>
              <div className={styles.multiColumnItem}>
                <div className={styles.multiColumnItemTitle}>Opcode</div>
                <div className={`${styles.multiColumnItemValue}`}>
                  <OpcodeChip opcode={result.inMsg.opcode} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {result.inMsg.amount && (
        <div className={styles.detailRow}>
          <div className={styles.detailLabel}>Amount In</div>
          <div className={`${styles.detailValue} ${styles.currencyValue}`}>
            {formatCurrency(result.inMsg.amount)}
          </div>
        </div>
      )}

      <div className={styles.labeledSectionRow}>
        <div className={styles.labeledSectionTitle}>Fees & Balance</div>
        <div className={styles.labeledSectionContent}>
          <div className={styles.multiColumnRow}>
            <div className={styles.multiColumnItem}>
              <div className={styles.multiColumnItemTitle}>Balance before</div>
              <div className={`${styles.multiColumnItemValue} ${styles.currencyValue}`}>
                {formatCurrency(money.balanceBefore)}
              </div>
            </div>
            <div className={styles.multiColumnItem}>
              <div className={styles.multiColumnItemTitle}>Amount Sent (Total)</div>
              <div className={`${styles.multiColumnItemValue} ${styles.currencyValue}`}>
                {formatCurrency(money.sentTotal)}
              </div>
            </div>
            <div className={styles.multiColumnItem}>
              <div className={styles.multiColumnItemTitle}>Total Fee</div>
              <div className={`${styles.multiColumnItemValue} ${styles.currencyValue}`}>
                {formatCurrency(money.totalFees)}
              </div>
            </div>
            <div className={styles.multiColumnItem}>
              <div className={styles.multiColumnItemTitle}>Gas Fee</div>
              <div
                className={`${styles.multiColumnItemValue} ${styles.gasValue} ${styles.currencyValue}`}
              >
                {tx.computeInfo !== "skipped" ? formatCurrency(tx.computeInfo.gasFees) : "N/A"}
              </div>
            </div>
            <div className={styles.multiColumnItem}>
              <div className={styles.multiColumnItemTitle}>Balance after</div>
              <div className={`${styles.multiColumnItemValue} ${styles.currencyValue}`}>
                {formatCurrency(money.balanceAfter)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.labeledSectionRow}>
        <div className={styles.labeledSectionTitle}>Compute Phase</div>
        <div className={styles.labeledSectionContent}>
          {tx.computeInfo === "skipped" ? (
            <div className={styles.detailValueFull}>Skipped</div>
          ) : (
            <div className={styles.multiColumnRow}>
              <div className={styles.multiColumnItem}>
                <div className={styles.multiColumnItemTitle}>Success</div>
                <div
                  className={`${styles.multiColumnItemValue} ${tx.computeInfo.success ? styles.booleanTrue : styles.booleanFalse}`}
                >
                  {formatBoolean(tx.computeInfo.success)}
                </div>
              </div>
              <div className={styles.multiColumnItem}>
                <div className={styles.multiColumnItemTitle}>Exit code</div>
                <div className={`${styles.multiColumnItemValue} ${styles.numberValue}`}>
                  <ExitCodeChip exitCode={tx.computeInfo.exitCode} />
                </div>
              </div>
              <div className={styles.multiColumnItem}>
                <div className={styles.multiColumnItemTitle}>VM steps</div>
                <div className={`${styles.multiColumnItemValue} ${styles.numberValue}`}>
                  {formatNumber(tx.computeInfo.vmSteps)}
                </div>
              </div>
              <div className={styles.multiColumnItem}>
                <div className={styles.multiColumnItemTitle}>Gas used</div>
                <div className={`${styles.multiColumnItemValue} ${styles.gasValue}`}>
                  {formatNumber(tx.computeInfo.gasUsed)}
                </div>
              </div>
              <div className={styles.multiColumnItem}>
                <div className={styles.multiColumnItemTitle}>Gas fees</div>
                <div
                  className={`${styles.multiColumnItemValue} ${styles.gasValue} ${styles.currencyValue}`}
                >
                  {formatCurrency(tx.computeInfo.gasFees)}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={styles.labeledSectionRow}>
        <div className={styles.labeledSectionTitle}>Action Phase</div>
        <div className={styles.labeledSectionContent}>
          <div className={styles.multiColumnRow}>
            <div className={styles.multiColumnItem}>
              <div className={styles.multiColumnItemTitle}>Success</div>
              <div
                className={`${styles.multiColumnItemValue} ${isSuccess ? styles.booleanTrue : styles.booleanFalse}`}
              >
                {formatBoolean(isSuccess)}
              </div>
            </div>
            <div className={styles.multiColumnItem}>
              <div className={styles.multiColumnItemTitle}>Total actions</div>
              <div className={`${styles.multiColumnItemValue} ${styles.numberValue}`}>
                {formatNumber(tx.actions.length)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {result.emulatorVersion && (
        <div className={styles.labeledSectionRow}>
          <div className={styles.labeledSectionTitle}>Meta</div>
          <div className={styles.labeledSectionContent}>
            <div className={styles.multiColumnRow}>
              <div className={styles.multiColumnItem}>
                <div className={styles.multiColumnItemTitle}>Emulator Version</div>
                <div className={`${styles.multiColumnItemValue} ${styles.hashValue}`}>
                  {result.emulatorVersion.commitHash.substring(0, 7)}
                </div>
              </div>
              <div className={styles.multiColumnItem}>
                <div className={styles.multiColumnItemTitle}>Emulator Date</div>
                <div className={`${styles.multiColumnItemValue} ${styles.timestampValue}`}>
                  {formatDetailedTimestamp(result.emulatorVersion?.commitDate)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
export default TransactionDetailsTable
