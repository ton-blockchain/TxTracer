import {useState, useEffect, useRef} from "react"
import "@xyflow/react/dist/style.css"
import {Cell, loadTransaction, type Transaction} from "@ton/core"

import PageHeader from "@shared/ui/PageHeader"

import styles from "./SandboxPage.module.css"

export type TransactionRawInfo = {
  readonly transaction: string
  readonly fields: object
  readonly parentId: string
  readonly childrenIds: string[]
}

export type TransactionsInfo = {
  readonly transactions: TransactionRawInfo[]
}

export type TransactionInfoRaw = {
  readonly transaction: Transaction
  readonly fields: object
  readonly parentId: string
  readonly childrenIds: string[]
}

export type TransactionInfo = {
  readonly transaction: Transaction
  readonly fields: object
  readonly parent: TransactionInfo | undefined
  readonly children: TransactionInfo[]
}

const txToTx = (tx: TransactionInfoRaw, txs: TransactionInfoRaw[]): TransactionInfo => {
  const parent = txs.find(it => it.transaction.lt.toString() === tx.parentId)
  return {
    ...tx,
    parent: parent ? txToTx(parent, txs) : undefined,
    children: tx.childrenIds
      .map(child => txs.find(it => it.transaction.lt.toString() === child))
      .filter(it => it !== undefined)
      .map(tx => txToTx(tx, txs)),
  } satisfies TransactionInfo
}

const toTxs = (txs: TransactionInfoRaw[]): TransactionInfo[] => {
  return txs.map(tx => txToTx(tx, txs))
}

function parseMaybeTransactions(event: MessageEvent<string>) {
  try {
    return JSON.parse(event.data) as TransactionsInfo
  } catch {
    return undefined
  }
}

type TestData = {
  readonly id: number
  readonly transactions: TransactionInfo[]
}

function TestFlow({testData}: {testData: TestData}) {
  return <div>{testData.id}</div>
}

function SandboxPage() {
  const [tests, setTests] = useState<TestData[]>([])
  const [error, setError] = useState<string>("")
  const currentTestIdRef = useRef(0)

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8080")

    ws.onopen = () => {
      setError("")
    }

    ws.onmessage = (event: MessageEvent<string>) => {
      if (event.data === "next test case") {
        currentTestIdRef.current += 1
        console.log("New test case:", currentTestIdRef.current)
        return
      }

      const transactions = parseMaybeTransactions(event)

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
            return [...prev, {id: testId, transactions: newTxs2}]
          }
        })
      }
    }

    ws.onerror = () => {
      setError("Не удалось подключиться к демону. Запустите: yarn daemon")
    }

    return () => ws.close()
  }, [])

  return (
    <>
      <div className={styles.traceViewWrapper}>
        <PageHeader pageTitle={"Sandbox"}></PageHeader>

        <main className={styles.appContainer}>
          {error && <div style={{padding: "20px", color: "red"}}>{error}</div>}
          <div style={{padding: "10px", overflowY: "auto"}}>
            {tests.map(testData => (
              <TestFlow key={testData.id} testData={testData} />
            ))}
          </div>
        </main>
      </div>
    </>
  )
}

export default SandboxPage
