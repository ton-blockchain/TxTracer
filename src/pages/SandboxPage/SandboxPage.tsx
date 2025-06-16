import React, {useState, useEffect, useRef} from "react"
import "@xyflow/react/dist/style.css"
import {
  type ABIType,
  Address,
  Cell,
  type ExternalAddress,
  loadStateInit,
  loadTransaction,
  type Slice,
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

type TestData = {
  readonly id: number
  readonly testName: string | undefined
  readonly transactions: TransactionInfo[]
}

function TransactionShortInfo({
  tx,
  contracts,
}: {
  tx: TransactionInfo
  contracts: Map<string, ContractData>
}) {
  if (tx.transaction.description.type !== "generic") {
    throw new Error(
      "TxTracer doesn't support non-generic transaction. Given type: " +
        tx.transaction.description.type,
    )
  }

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
    try {
      return addr ? Address.parseRaw(`0:${addr.toString(16)}`) : undefined
    } catch {
      return undefined
    }
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

  const logs = tx.fields["vmLogs"] as string
  const blockchainLogs = tx.fields["blockchainLogs"] as string
  const debugLogs = tx.fields["debugLogs"] as string

  return (
    <div>
      <div>lt: {tx.transaction.lt}</div>
      <div>this: {formatAddress(bigintToAddress(tx?.transaction?.address)) ?? "no parent"}</div>
      <div>parent tx: {tx.parent?.transaction?.lt ?? "unknown"}</div>
      <div>
        in msg: {formatAddress(tx.transaction.inMessage?.info?.src)}
        {" -> "}
        {formatAddress(tx.transaction.inMessage?.info?.dest)}
      </div>
      <div>out: {tx.transaction.outMessagesCount}</div>
      {computeInfo === "skipped" ? (
        <div>skipped</div>
      ) : (
        <div>
          <div>success: {(computeInfo?.success ?? false) ? "true" : "false"}</div>
          <div>exit code: {computeInfo?.exitCode}</div>
          <div>vmSteps: {computeInfo?.vmSteps}</div>
          <div>gasUsed: {computeInfo?.gasUsed}</div>
          <div>gasFees: {computeInfo?.gasFees}</div>
          <div>vmLogs: {logs.slice(0, Math.min(100, logs.length))}</div>
          <div>blockchainLogs: {blockchainLogs.slice(0, Math.min(100, blockchainLogs.length))}</div>
          <div>debugLogs: {debugLogs.slice(0, Math.min(100, debugLogs.length))}</div>
        </div>
      )}
      <br />
    </div>
  )
}

function TestFlow({
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
      <div>
        {testData.testName ?? "unknown test"}: {testData.id}
      </div>
      {transactions.map((tx, index) => (
        <TransactionShortInfo key={index} tx={tx} contracts={contracts} />
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
  | {readonly $: "txs"; readonly testName: string | undefined; readonly data: string}
  | {readonly $: "known-contracts"; readonly data: readonly ContractRawData[]}

type ContractData = {
  readonly address: Address
  readonly meta: ContractMeta | undefined
  readonly stateInit: StateInit | undefined
}

function findAbiType(data: ContractData, name: string) {
  return data.meta?.abi?.types?.find(it => it.name === `${name}$Data`)
}

function getStateInit(data: ContractData) {
  const initData = data.stateInit?.data
  if (initData) {
    const copy = Cell.fromHex(initData.toBoc().toString("hex"))
    const name = data.meta?.wrapperName
    if (!name) return undefined

    const abi = findAbiType(data, name)
    if (abi) {
      console.log(`found abi data for ${data.meta?.wrapperName ?? "unknown contract"}`)
      return parseStateInit(copy.asSlice(), abi)
    }

    const otherName =
      name === "ExtendedShardedJettonWallet"
        ? "JettonWalletSharded"
        : name === "ExtendedShardedJettonMinter"
          ? "JettonMinterSharded"
          : name

    const abi2 = findAbiType(data, otherName)
    if (abi2) {
      console.log(`found abi data for ${data.meta?.wrapperName ?? "unknown contract"}`)
      return parseStateInit(copy.asSlice(), abi2)
    }

    console.log(`no abi data for ${data.meta?.wrapperName ?? "unknown contract"}`)
  }
  return undefined
}

function ContractInfo(props: {data: ContractData; address: string}) {
  const stateInit = getStateInit(props.data)

  const assembly = props.data.stateInit?.code
    ? print(decompileCell(props.data.stateInit?.code))
    : ""

  return (
    <div>
      {props.data.meta?.treasurySeed ? (
        <p>Treasury: {props.data.meta.treasurySeed}</p>
      ) : (
        <p>Contract: {props.data.meta?.wrapperName ?? "unknown name"}</p>
      )}
      <div>
        <AddressChip address={props.address.toString()} />
      </div>
      <div>Code: {props.data.stateInit?.code?.toBoc()?.toString("hex")}</div>
      <div>Init: {props.data.stateInit?.data?.toBoc()?.toString("hex")}</div>

      {stateInit && (
        <div>
          Init parsed:
          {Object.entries(stateInit).map(([key, value]) => (
            <div key={key}>
              &nbsp;&nbsp;&nbsp;{key.toString()}
              {": "}
              {value instanceof Address ? (
                <AddressChip address={value.toString()} />
              ) : (
                value.toString()
              )}
            </div>
          ))}
        </div>
      )}
      <div>Assembly: {assembly.substring(0, Math.min(300, assembly.length - 1))}</div>
    </div>
  )
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
        }))
        setContracts(new Map(newContracts.map(it => [it.address.toString(), it])))
      }
    }

    ws.onerror = () => {
      setError("Cannot connect to the daemon. Run: yarn daemon")
    }

    return () => ws.close()
  }, [])

  console.log(contracts)

  return (
    <>
      <div className={styles.traceViewWrapper}>
        <PageHeader pageTitle={"Sandbox"}></PageHeader>

        <main className={styles.appContainer}>
          {error && <div style={{padding: "20px", color: "red"}}>{error}</div>}
          <div style={{padding: "10px", overflowY: "auto"}}>
            Contracts:
            {[...contracts.entries()].map(([address, data], i) => (
              <ContractInfo key={i} data={data} address={address} />
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

function parseStateInit(
  init: Slice,
  abi: ABIType,
): Record<string, number | bigint | Address | Cell> | undefined {
  const res: Record<string, number | bigint | Address | Cell> = {}

  for (const [index, field] of abi.fields.entries()) {
    try {
      if (field.type.kind === "simple") {
        if (field.type.type === "address") {
          res[field.name] = init.loadAddress()
        } else if (field.type.type === "bool") {
          res[field.name] = init.loadUint(1)
        } else if (field.type.type === "uint" && typeof field.type.format === "number") {
          res[field.name] = init.loadUint(field.type.format)
        } else if (field.type.type === "int" && typeof field.type.format === "number") {
          res[field.name] = init.loadInt(field.type.format)
        } else if (field.type.type === "uint" && typeof field.type.format === "string") {
          if (field.type.format === "varuint16" || field.type.format === "coins") {
            res[field.name] = init.loadVarUintBig(4)
          } else if (field.type.format === "varuint32") {
            res[field.name] = init.loadVarUintBig(8)
          }
        } else if (field.type.type === "int" && typeof field.type.format === "string") {
          if (field.type.format === "varint16") {
            res[field.name] = init.loadVarIntBig(4)
          } else if (field.type.format === "varint32") {
            res[field.name] = init.loadVarUintBig(8)
          }
        } else if (field.type.type === "cell" || field.type.type === "string") {
          res[field.name] = init.loadRef()
        } else if (field.type.format === "ref") {
          res[field.name] = init.loadRef()
        } else {
          console.log("skip", field)
          return undefined
        }
      }
    } catch (error) {
      console.error(`Error while parsing ${field.name} of ${abi.name} at index ${index}: ${error}`)
    }
  }

  return res
}

export default SandboxPage
