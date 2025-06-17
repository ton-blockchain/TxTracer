import React, {useEffect, useRef, useState} from "react"
import "@xyflow/react/dist/style.css"
import {
  Address,
  Cell,
  type ExternalAddress,
  loadShardAccount,
  loadStateInit,
  loadTransaction,
  type ShardAccount,
  type StateInit,
  type Transaction,
} from "@ton/core"

import type {ContractMeta} from "@ton/sandbox/dist/meta/ContractsMeta"

import type {Maybe} from "@ton/core/dist/utils/maybe"

import {compileCellWithMapping, decompileCell} from "ton-assembly-test-dev/dist/runtime/instr"

import {parse, print} from "ton-assembly-test-dev/dist/text"
import {createMappingInfo} from "ton-assembly-test-dev/dist/trace/mapping"
import {createTraceInfoPerTransaction} from "ton-assembly-test-dev/dist/trace/trace"

import type {TraceInfo} from "ton-assembly-test-dev/dist/trace"

import PageHeader from "@shared/ui/PageHeader"
import AddressChip from "@shared/ui/AddressChip"

import {type ExitCode, findExitCode} from "@features/txTrace/lib/traceTx.ts"

import {
  bigintToAddress,
  findOpcodeAbi,
  type ParsedSlice,
  parseSliceWithAbiType,
} from "@app/pages/SandboxPage/common.ts"

import ContractDetails from "@shared/ui/ContractDetails"

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

const formatAddress = (
  address: Address | Maybe<ExternalAddress> | undefined,
  contracts: Map<string, ContractData>,
): React.ReactNode => {
  if (!address) {
    return <AddressChip address={"unknown"} />
  }

  const meta = contracts.get(address.toString())
  if (meta) {
    const name =
      meta.meta?.treasurySeed ??
      meta.meta?.wrapperName ??
      findContractWithMatchingCode(contracts, contracts.get(address.toString())?.stateInit?.code)
        ?.meta?.wrapperName
    if (name) {
      return <AddressChip address={address.toString() + ` (${name})`} />
    }
  }

  return <AddressChip address={address.toString()} />
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

  const vmLogs = tx.fields["vmLogs"] as string
  const blockchainLogs = tx.fields["blockchainLogs"] as string
  const debugLogs = tx.fields["debugLogs"] as string

  let steps = ""
  const thisAddress = bigintToAddress(tx?.transaction?.address)
  if (thisAddress) {
    const contract = contracts.get(thisAddress.toString())
    if (contract?.stateInit?.code) {
      const {traceInfo} = extractCodeAndTrace(contract?.stateInit?.code, vmLogs)

      steps = traceInfo?.steps?.map(it => it.instructionName).join(" ")
    }
  }

  // for (const [, value] of tx.transaction.outMessages) {
  //   if (value.init) {
  //     const contract = [...contracts.values()].find(
  //       it =>
  //         it.stateInit?.code?.toBoc()?.toString("hex") ===
  //         value.init?.code?.toBoc()?.toString("hex"),
  //     )
  //
  //     const address = contractAddress(0, value.init)
  //     console.log(value)
  //     console.log(address.toString())
  //     console.log(contract?.meta?.wrapperName)
  //   }
  // }

  const value =
    tx.transaction.inMessage?.info?.type === "internal"
      ? tx.transaction.inMessage?.info.value?.coins
      : undefined

  let opcode: number | undefined = undefined
  const slice = tx.transaction.inMessage?.body?.asSlice()
  if (slice && slice.remainingBits >= 32) {
    opcode = slice.loadUint(32)
  }

  let inMsgBodyParsed: Record<string, ParsedSlice> | undefined = undefined

  const abiType = findOpcodeAbi(tx, contracts, opcode)

  if (thisAddress) {
    const contract = contracts.get(thisAddress.toString())
    if (contract?.meta?.abi) {
      if (slice && abiType) {
        inMsgBodyParsed = parseSliceWithAbiType(slice, abiType, contract?.meta?.abi.types ?? [])
      }
    }
  }

  return (
    <div>
      <div>lt: {tx.transaction.lt}</div>
      <div>this: {formatAddress(thisAddress, contracts) ?? "unknown this"}</div>
      <div>parent tx: {tx.parent?.transaction?.lt ?? "unknown"}</div>
      <div>
        in msg: {formatAddress(tx.transaction.inMessage?.info?.src, contracts)}
        {" -> "}
        {formatAddress(tx.transaction.inMessage?.info?.dest, contracts)}
      </div>
      <div>in msg with init: {tx.transaction.inMessage?.init ? "true" : "false"}</div>
      <div>in msg opcode: {opcode}</div>
      <div>in msg type: {abiType?.name ?? "unknown"}</div>

      {inMsgBodyParsed && <div>in msg data: {showRecordValues(inMsgBodyParsed)}</div>}

      <div>value: {value}</div>
      <div>out: {tx.transaction.outMessagesCount}</div>
      {computeInfo === "skipped" ? (
        <div>skipped</div>
      ) : (
        <div>
          <div>success: {(computeInfo?.success ?? false) ? "true" : "false"}</div>
          <div>exit code: {computeInfo?.exitCode}</div>
          <div>vmSteps: {computeInfo?.vmSteps}</div>
          <div>steps: {steps.slice(0, Math.min(100, steps.length))}</div>
          <div>gasUsed: {computeInfo?.gasUsed}</div>
          <div>gasFees: {computeInfo?.gasFees}</div>
          <div>vmLogs: {vmLogs.slice(0, Math.min(100, vmLogs.length))}</div>
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
        <h3>
          {testData.testName ?? "unknown test"}: {testData.id}
        </h3>
      </div>

      <div style={{marginTop: "20px"}}>
        <h4>Transaction Details:</h4>
        {transactions.map((tx, index) => (
          <TransactionShortInfo key={index} tx={tx} contracts={contracts} />
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

function findContractWithMatchingCode(contracts: Map<string, ContractData>, code: Maybe<Cell>) {
  return [...contracts.values()].find(
    it => it.stateInit?.code?.toBoc()?.toString("hex") === code?.toBoc()?.toString("hex"),
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

function showRecordValues(data: Record<string, ParsedSlice>) {
  return (
    <>
      {Object.entries(data).map(([key, value]) => (
        <div key={key}>
          &nbsp;&nbsp;&nbsp;{key.toString()}
          {": "}
          {value instanceof Address ? (
            <AddressChip address={value.toString()} />
          ) : value &&
            typeof value === "object" &&
            "$" in value &&
            value.$ === "sub-object" &&
            value.value ? (
            showRecordValues(value.value)
          ) : (
            // eslint-disable-next-line @typescript-eslint/no-base-to-string
            value?.toString()
          )}
        </div>
      ))}
    </>
  )
}

function SandboxPage() {
  const [tests, setTests] = useState<TestData[]>([])
  const [contracts, setContracts] = useState<Map<string, ContractData>>(new Map())
  const [error, setError] = useState<string>("")
  const currentTestIdRef = useRef(0)

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
                contract={data}
                tests={tests}
                isDeployed={false}
              />
            ))}
            <br />
            <b>Transaction Trees:</b>
            {tests.map(testData => (
              <TransactionTree
                key={`tree-${testData.id}`}
                testData={testData}
                contracts={contracts}
              />
            ))}
            <br />
            <b>Transaction Details:</b>
            {tests.map(testData => (
              <TestFlow key={testData.id} contracts={contracts} testData={testData} />
            ))}
          </div>
        </main>
      </div>
    </>
  )
}

function extractCodeAndTrace(
  codeCell: Cell | undefined,
  vmLogs: string,
): {
  code: string
  exitCode?: ExitCode
  traceInfo: TraceInfo
} {
  if (!codeCell) {
    return {code: "// No executable code found", traceInfo: {steps: []}}
  }

  const instructions = decompileCell(codeCell)
  const code = print(instructions)

  const instructionsWithPositions = parse("out.tasm", code)
  if (instructionsWithPositions.$ === "ParseFailure") {
    return {code: code, traceInfo: {steps: []}, exitCode: undefined}
  }

  const [, mapping] = compileCellWithMapping(instructionsWithPositions.instructions)
  const mappingInfo = createMappingInfo(mapping)
  const traceInfo = createTraceInfoPerTransaction(vmLogs, mappingInfo, undefined)[0]

  const exitCode = findExitCode(vmLogs, mappingInfo)
  if (exitCode === undefined) {
    return {code, exitCode: undefined, traceInfo}
  }

  return {code, exitCode, traceInfo}
}

export default SandboxPage
