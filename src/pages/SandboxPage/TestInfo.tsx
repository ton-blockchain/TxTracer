import type {ContractData} from "@features/sandbox/lib/contract.ts"
import type {TestData} from "@features/sandbox/lib/test-data.ts"
import {TransactionTree} from "@app/pages/SandboxPage/components"
import {TransactionShortInfo} from "@app/pages/SandboxPage/TransactionShortInfo.tsx"

export function TestInfo({
  contracts,
  testData,
}: {
  contracts: Map<string, ContractData>
  testData: TestData
}) {
  const transactions = testData.transactions.filter(it => {
    return (
      it.transaction.inMessage?.info?.src?.toString() !==
      "EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c"
    )
  })

  return (
    <>
      <h3>
        {testData.testName ?? "unknown test"}: {testData.id}
      </h3>

      <h4>Transaction Tree:</h4>
      <TransactionTree key={`tree-${testData.id}`} testData={testData} contracts={contracts} />

      <div>
        <h4>Transaction Details:</h4>
        {transactions.map((tx, index) => (
          <TransactionShortInfo key={index} tx={tx} contracts={contracts} />
        ))}
      </div>
    </>
  )
}
