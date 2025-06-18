import {useMemo} from "react"
import "@xyflow/react/dist/style.css"

import PageHeader from "@shared/ui/PageHeader"
import ContractDetails from "@shared/ui/ContractDetails"

import {TransactionShortInfo} from "@app/pages/SandboxPage/TransactionShortInfo.tsx"
import {useWebsocketRawData} from "@features/sandbox/lib/transport/useWebsocketRawData.ts"

import type {ContractData, ContractLetter} from "@features/sandbox/lib/contract.ts"

import type {TestData} from "@features/sandbox/lib/test-data.ts"

import {TransactionTree} from "./components"

import styles from "./SandboxPage.module.css"

function TestFlow({
  contracts,
  contractLetters,
  testData,
}: {
  contracts: Map<string, ContractData>
  contractLetters: Map<string, ContractLetter>
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
      <div>
        <h3>
          {testData.testName ?? "unknown test"}: {testData.id}
        </h3>
      </div>

      <h4>Transaction Tree:</h4>
      <TransactionTree key={`tree-${testData.id}`} testData={testData} contracts={contracts} />

      <div style={{marginTop: "20px"}}>
        <h4>Transaction Details:</h4>
        {transactions.map((tx, index) => (
          <TransactionShortInfo
            key={index}
            tx={tx}
            contracts={contracts}
            contractLetters={contractLetters}
          />
        ))}
      </div>
    </>
  )
}

// @ts-expect-error todo
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function isContractDeployedInside(
  tests: TestData[],
  contracts: Map<string, ContractData>,
): boolean {
  for (const test of tests) {
    for (const tx of test.transactions) {
      for (const [_, value] of tx.transaction.outMessages) {
        const init = value.init
        if (!init) continue // not a deployment

        const src = tx.transaction?.inMessage?.info?.src
        if (!src) continue

        const thisContract = contracts.get(src.toString())
        if (thisContract?.meta?.treasurySeed) {
          continue
        }

        // search for contract with the same code
        const contract = [...contracts.values()].find(
          it =>
            it.stateInit?.code?.toBoc()?.toString("hex") === init?.code?.toBoc()?.toString("hex"),
        )

        if (contract) {
          return true
        }
      }
    }
  }
  return false
}

function SandboxPage() {
  const {tests, contracts, error} = useWebsocketRawData({})

  const contractLetters = useMemo(() => {
    const letters = Array.from(contracts.entries()).map(([address, contract], index) => {
      const letter = String.fromCharCode(65 + (index % 26))
      const name = contract.meta?.treasurySeed
        ? contract.meta?.treasurySeed
        : (contract.meta?.wrapperName ?? "Unknown Contract")

      return {
        letter,
        address,
        name,
      }
    })
    return new Map(letters.map(item => [item.address, item]))
  }, [contracts])

  console.log(contracts)

  return (
    <>
      <div className={styles.traceViewWrapper}>
        <PageHeader pageTitle={"Sandbox"}></PageHeader>

        <main className={styles.appContainer}>
          {error && <div style={{padding: "20px", color: "red"}}>{error}</div>}
          <div style={{padding: "10px", overflowY: "auto"}}>
            {[...contracts.entries()].map(([, data], i) => (
              <ContractDetails
                key={i}
                contracts={contracts}
                contractLetters={contractLetters}
                contract={data}
                tests={tests}
                isDeployed={false}
              />
            ))}
            <br />
            {tests.map(testData => (
              <TestFlow
                key={testData.id}
                contracts={contracts}
                contractLetters={contractLetters}
                testData={testData}
              />
            ))}
          </div>
        </main>
      </div>
    </>
  )
}

export default SandboxPage
