import {useState} from "react"

import type {TestData} from "@features/sandbox/lib/test-data.ts"
import {TransactionTree} from "@app/pages/SandboxPage/components"
import {ChevronDownIcon, ChevronUpIcon} from "@shared/ui/Icon"

import type {MessageTestData} from "@features/sandbox/lib/transport/message.ts"

import {DownloadTestDataButton} from "@app/pages/SandboxPage/components/DownloadTestDataButton.tsx"

import styles from "./TestInfo.module.css"

export interface TestInfoProps {
  readonly testData: TestData
  readonly testIndex: number
  readonly rawTestData?: MessageTestData[]
}

export function TestInfo({testData, testIndex, rawTestData}: TestInfoProps) {
  const [collapsed, setCollapsed] = useState(false)

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
        <div className={styles.titleRow}>
          <div className={styles.titleSection}>
            <h2 className={styles.testTitle}>
              #{testIndex} {testData.testName}
            </h2>
            <DownloadTestDataButton rawData={rawTestData ?? []} />
          </div>
          <button
            className={styles.collapseButton}
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Expand test info" : "Collapse test info"}
          >
            {collapsed ? <ChevronDownIcon /> : <ChevronUpIcon />}
          </button>
        </div>
        {!collapsed && (
          <>
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
                <span className={styles.statLabel}>Contracts:</span> {testData.contracts.size}
              </span>
            </div>
          </>
        )}
      </div>

      {!collapsed && <TransactionTree key={`tree-${testData.testName}`} testData={testData} />}
    </div>
  )
}
