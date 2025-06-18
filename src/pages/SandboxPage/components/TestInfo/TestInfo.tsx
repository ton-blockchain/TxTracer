import type {ContractData} from "@features/sandbox/lib/contract.ts"
import type {TestData} from "@features/sandbox/lib/test-data.ts"
import {TransactionTree} from "@app/pages/SandboxPage/components"

import styles from "./TestInfo.module.css"

export interface TestInfoProps {
  readonly contracts: Map<string, ContractData>
  readonly testData: TestData
}

export function TestInfo({contracts, testData}: TestInfoProps) {
  // const transactions = testData.transactions.filter(it => {
  //   return (
  //     it.transaction.inMessage?.info?.src?.toString() !==
  //     "EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c"
  //   )
  // })

  const formatTimestamp = (timestamp?: number): string => {
    if (!timestamp) return ""
    const date = new Date(timestamp)
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })
  }

  const countTxs = testData.transactions.length
  const rootTxs = testData.transactions.filter(tx => !tx.parent)
  const countRootTxs = rootTxs.length

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.testTitle}>
          #{testData.id} {testData.testName ?? "unknown test"}
        </h2>
        {testData.timestamp && (
          <p className={styles.timestamp}>Executed at: {formatTimestamp(testData.timestamp)}</p>
        )}

        <div className={styles.stats}>
          <span className={styles.statItem}>
            <span className={styles.statLabel}>Total transactions:</span> {countTxs}
          </span>
          {countRootTxs > 1 && (
            <span className={styles.statItem}>
              <span className={styles.statLabel}>Transaction sequences:</span> {countRootTxs}
            </span>
          )}
          <span className={styles.statItem}>
            <span className={styles.statLabel}>Contracts:</span> {contracts.size}
          </span>
        </div>
      </div>

      <TransactionTree key={`tree-${testData.id}`} testData={testData} contracts={contracts} />

      {/*<div className={styles.transactionDetails}>*/}
      {/*  <h4 className={styles.sectionTitle}>Transaction Details:</h4>*/}
      {/*  {transactions.map((tx, index) => (*/}
      {/*    <TransactionShortInfo key={index} tx={tx} contracts={contracts} />*/}
      {/*  ))}*/}
      {/*</div>*/}
    </div>
  )
}
