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

  return (
    <div className={styles.container}>
      <h3 className={styles.testTitle}>
        #{testData.id} {testData.testName ?? "unknown test"}
      </h3>

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
