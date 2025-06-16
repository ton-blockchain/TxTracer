import React, {useState, useEffect, useRef} from "react"
import "@xyflow/react/dist/style.css"
import {
  Address,
  Cell,
  type ExternalAddress,
  loadStateInit,
  loadTransaction,
  type StateInit,
  type Transaction,
} from "@ton/core"

import type {ContractMeta} from "@ton/sandbox/dist/meta/ContractsMeta"

import type {Maybe} from "@ton/core/dist/utils/maybe"

import {decompileCell} from "ton-assembly-test-dev/dist/runtime/instr"

import {print} from "ton-assembly-test-dev/dist/text"

import PageHeader from "@shared/ui/PageHeader"

import AddressChip from "@shared/ui/AddressChip"

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

type TestData = {
  readonly id: number
  readonly transactions: TransactionInfo[]
}

function TestFlow({
  contracts,
  testData,
}: {
  contracts: Map<string, ContractData>
  testData: TestData
}) {
  const formatAddress = (
    address: Address | Maybe<ExternalAddress> | undefined,
  ): React.ReactNode => {
    if (!address) {
      return <AddressChip address={"unknown"} />
    }
    const meta = contracts.get(address.toString())
    if (meta) {
      const name = meta.meta?.treasurySeed ?? meta.meta?.wrapperName
      if (name) {
        return <AddressChip address={address.toString() + ` (${name})`} />
      }
    }

    return <AddressChip address={address.toString()} />
  }

  const bigintToAddress = (addr: bigint | undefined): Address | undefined => {
    return addr ? Address.parseRaw(`0:${addr.toString(16)}`) : undefined
  }

  const transactions = testData.transactions.filter(it => {
    return (
      it.transaction.inMessage?.info?.src?.toString() !==
      "EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c"
    )
  })

  return (
    <>
      <div>{testData.id}</div>
      {transactions.map((tx, index) => (
        <div key={index}>
          <div>lt: {tx.transaction.lt}</div>
          <div>this: {formatAddress(bigintToAddress(tx?.transaction?.address)) ?? "no parent"}</div>
          <div>parent tx: {tx.parent?.transaction?.lt ?? "unknown"}</div>
          <div>
            in msg: {formatAddress(tx.transaction.inMessage?.info?.src)}
            {" -> "}
            {formatAddress(tx.transaction.inMessage?.info?.dest)}
          </div>
          <div>out: {tx.transaction.outMessagesCount}</div>
          <br />
        </div>
      ))}
    </>
  )
}

type ContractRawData = {
  readonly address: string
  readonly meta: ContractMeta | undefined
  readonly stateInit: string | undefined
}

export type Message =
  | {readonly $: "next-test"}
  | {readonly $: "txs"; readonly data: string}
  | {readonly $: "known-contracts"; readonly data: readonly ContractRawData[]}

type ContractData = {
  readonly address: Address
  readonly meta: ContractMeta | undefined
  readonly stateInit: StateInit | undefined
}

function SandboxPage() {
  const [tests, setTests] = useState<TestData[]>([])
  const [contracts, setContracts] = useState<Map<string, ContractData>>(new Map())
  const [error, setError] = useState<string>("")
  const currentTestIdRef = useRef(0)

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8080")

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

      if (message.$ === "known-contracts") {
        const newContracts: ContractData[] = message.data.map(it => ({
          ...it,
          address: Address.parse(it.address),
          stateInit: it.stateInit ? loadStateInit(Cell.fromHex(it.stateInit).asSlice()) : undefined,
        }))
        setContracts(new Map(newContracts.map(it => [it.address.toString(), it])))
      }
    }

    ws.onerror = () => {
      setError("Cannot connect to the daemon. Run: yarn daemon")
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
            Contracts:
            {[...contracts.entries()].map(([address, data], i) => (
              <div key={i}>
                {data.meta?.treasurySeed ? (
                  <p>Treasury: {data.meta.treasurySeed}</p>
                ) : (
                  <p>Contract: {data.meta?.wrapperName ?? "unknown name"}</p>
                )}
                <div>
                  <AddressChip address={address.toString()} />
                </div>
                <div>Code: {data.stateInit?.code?.toBoc()?.toString("hex")}</div>
                <div>
                  Assembly: {data.stateInit?.code ? print(decompileCell(data.stateInit?.code)) : ""}
                </div>
              </div>
            ))}
            Txs:
            {tests.map(testData => (
              <TestFlow key={testData.id} contracts={contracts} testData={testData} />
            ))}
          </div>
        </main>
      </div>
    </>
  )
}

export default SandboxPage
