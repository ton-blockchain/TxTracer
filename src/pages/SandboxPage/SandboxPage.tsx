import {useEffect, useMemo, useRef, useState} from "react"
import "@xyflow/react/dist/style.css"
import {
  Address,
  Cell,
  loadShardAccount,
  loadStateInit,
  loadTransaction,
  type ShardAccount,
  type StateInit,
  type Transaction,
} from "@ton/core"

import type {ContractMeta} from "@ton/sandbox/dist/meta/ContractsMeta"

import PageHeader from "@shared/ui/PageHeader"

import ContractDetails from "@shared/ui/ContractDetails"

import {TransactionShortInfo} from "@app/pages/SandboxPage/TransactionShortInfo.tsx"

import {TransactionTree} from "./components"

import styles from "./SandboxPage.module.css"

export type TransactionRawInfo = {
  readonly transaction: string
  readonly fields: Record<string, unknown>
  readonly parentId: string
  readonly childrenIds: string[]
}

export type TransactionsInfo = {
  readonly transactions: TransactionRawInfo[]
}

export type TransactionInfoRaw = {
  readonly transaction: Transaction
  readonly fields: Record<string, unknown>
  readonly parentId: string
  readonly childrenIds: string[]
}

export type TransactionInfo = {
  readonly transaction: Transaction
  readonly fields: Record<string, unknown>
  readonly parent: TransactionInfo | undefined
  readonly children: TransactionInfo[]
}

const txToTx = (
  tx: TransactionInfoRaw,
  txs: TransactionInfoRaw[],
  visited: Map<TransactionInfoRaw, TransactionInfo>,
): TransactionInfo => {
  const cached = visited.get(tx)
  if (cached) {
    return cached
  }

  const result: Partial<TransactionInfo> = {
    ...tx,
  }
  visited.set(tx, result as TransactionInfo)

  const parent = txs.find(it => it.transaction.lt.toString() === tx.parentId)

  // @ts-expect-error for now
  result.parent = parent ? txToTx(parent, txs, visited) : undefined
  // @ts-expect-error for now
  result.children = tx.childrenIds
    .map(child => txs.find(it => it.transaction.lt.toString() === child))
    .filter(it => it !== undefined)
    .map(tx => txToTx(tx, txs, visited))

  return result as TransactionInfo
}

const toTxs = (txs: TransactionInfoRaw[]): TransactionInfo[] => {
  return txs.map(tx => txToTx(tx, txs, new Map()))
}

function parseMaybeTransactions(data: string) {
  try {
    return JSON.parse(data) as TransactionsInfo
  } catch {
    return undefined
  }
}

export type TestData = {
  readonly id: number
  readonly testName: string | undefined
  readonly transactions: TransactionInfo[]
}

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

type ContractRawData = {
  readonly address: string
  readonly meta: ContractMeta | undefined
  readonly stateInit: string | undefined
  readonly account: string
}

export type Message =
  | {readonly $: "next-test"}
  | {readonly $: "txs"; readonly testName: string | undefined; readonly data: string}
  | {readonly $: "known-contracts"; readonly data: readonly ContractRawData[]}

export type ContractData = {
  readonly address: Address
  readonly meta: ContractMeta | undefined
  readonly stateInit: StateInit | undefined
  readonly account: ShardAccount
}

export type ContractLetter = {
  readonly letter: string
  readonly address: string
  readonly name: string
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
  const [tests, setTests] = useState<TestData[]>([])
  const [contracts, setContracts] = useState<Map<string, ContractData>>(new Map())
  const [error, setError] = useState<string>("")
  const currentTestIdRef = useRef(0)

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

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8081")

    ws.onopen = () => {
      setError("")
    }

    ws.onmessage = (event: MessageEvent<string>) => {
      const message: Message = JSON.parse(event.data) as Message
      if (message.$ === "next-test") {
        currentTestIdRef.current += 1
        console.log("New test case:", currentTestIdRef.current)
        return
      }

      if (message.$ === "txs") {
        const transactions = parseMaybeTransactions(message.data)

        console.log("length", transactions?.transactions?.length)
        if (transactions) {
          const newTxs = transactions.transactions.map(it => ({
            ...it,
            transaction: loadTransaction(Cell.fromHex(it.transaction).asSlice()),
          }))

          const testId = currentTestIdRef.current
          console.log("Adding transactions to test:", testId, "transactions:", newTxs.length)

          const newTxs2 = toTxs(newTxs)

          setTests(prev => {
            const existing = prev.find(test => test.id === testId)
            if (existing) {
              console.log("Updating existing test:", testId)
              return prev.map(test =>
                test.id === testId
                  ? {...test, transactions: [...test.transactions, ...newTxs2]}
                  : test,
              )
            } else {
              console.log("Creating new test:", testId)
              return [...prev, {id: testId, testName: message.testName, transactions: newTxs2}]
            }
          })
        }
      }

      if (message.$ === "known-contracts") {
        const newContracts: ContractData[] = message.data.map(it => ({
          ...it,
          address: Address.parse(it.address),
          stateInit: it.stateInit ? loadStateInit(Cell.fromHex(it.stateInit).asSlice()) : undefined,
          account: loadShardAccount(Cell.fromHex(it.account).asSlice()),
        }))
        setContracts(new Map(newContracts.map(it => [it.address.toString(), it])))
      }
    }

    ws.onerror = () => {
      setError("Cannot connect to the daemon. Run: yarn daemon")
    }

    return () => {
      ws.close()
    }
  }, [])

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
