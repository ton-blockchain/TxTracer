import {useCallback, useMemo, useState} from "react"
import {Address, Cell, loadShardAccount, loadStateInit, loadTransaction} from "@ton/core"

import type {ContractRawData} from "@features/sandbox/lib/transport/contract.ts"

import type {MessageTestData} from "@features/sandbox/lib/transport/message.ts"

import {
  processRawTransactions,
  type RawTransactionInfo,
  type RawTransactions,
} from "./transport/transaction"
import type {ContractData} from "./contract"
import type {TestData} from "./test-data"

interface UseSandboxDataReturn {
  readonly tests: TestData[]
  readonly error: string
  readonly isConnected: boolean
  readonly isSharedData: boolean
  readonly rawData: MessageTestData[]
  readonly rawDataByTest: Map<string, MessageTestData>
  readonly loadFromFile: (data: MessageTestData[]) => void
  readonly clearFileData: () => void
}

interface RawTestData {
  readonly testName: string
  readonly transactions: RawTransactions
  readonly timestamp: number
  readonly changes: MessageTestData["changes"]
  readonly valueFlow: MessageTestData["valueFlow"]
}

function getStateInit(contract: ContractRawData) {
  return contract.stateInit ? loadStateInit(Cell.fromHex(contract.stateInit).asSlice()) : undefined
}

function findContractWithMatchingCode(contracts: readonly ContractRawData[], code: Cell) {
  return contracts.find(it => {
    const stateInit = getStateInit(it)
    return stateInit?.code?.toBoc()?.toString("hex") === code?.toBoc()?.toString("hex")
  })
}

function findContractNameSimple(contract: ContractRawData) {
  if (contract.meta?.treasurySeed) {
    return contract.meta?.treasurySeed
  }

  if (contract.meta?.wrapperName) {
    return contract.meta?.wrapperName
  }

  return undefined
}

function findContractName(
  contract: ContractRawData,
  contracts: readonly ContractRawData[],
): string {
  const name = findContractNameSimple(contract)
  if (name) return name

  const stateInit = getStateInit(contract)
  const code = stateInit?.code
  if (code) {
    const contract = findContractWithMatchingCode(contracts, code)
    if (contract) {
      const name = findContractNameSimple(contract)
      if (name) return name
    }
  }

  return "Unknown Contract"
}

function parseMaybeTransactions(data: string): RawTransactions | undefined {
  try {
    return JSON.parse(data) as RawTransactions
  } catch {
    return undefined
  }
}

function buildRawTests(rawData: readonly MessageTestData[]): RawTestData[] {
  const tests = new Map<string, RawTestData>()

  for (const message of rawData) {
    const rawTransactions = parseMaybeTransactions(message.transactions)
    if (!rawTransactions) {
      console.error("Cannot parse transactions:", message)
      continue
    }

    const testName = message.testName ?? "unknown"
    const existing = tests.get(testName)

    if (existing) {
      tests.set(testName, {
        ...existing,
        transactions: {
          transactions: [...existing.transactions.transactions, ...rawTransactions.transactions],
        },
        changes: [...existing.changes, ...message.changes],
      })
      continue
    }

    tests.set(testName, {
      testName,
      transactions: rawTransactions,
      timestamp: Date.now(),
      changes: message.changes,
      valueFlow: message.valueFlow,
    })
  }

  return [...tests.values()]
}

function buildContractsByTest(
  rawData: readonly MessageTestData[],
): Map<string, readonly ContractRawData[]> {
  const contractsByTest = new Map<string, readonly ContractRawData[]>()

  for (const message of rawData) {
    contractsByTest.set(message.testName ?? "unknown", message.contracts)
  }

  return contractsByTest
}

export function useSandboxData(): UseSandboxDataReturn {
  const [rawData, setRawData] = useState<MessageTestData[]>([])

  const loadFromFile = useCallback((data: MessageTestData[]) => {
    setRawData(data)
  }, [])

  const clearFileData = useCallback(() => {
    setRawData([])
  }, [])

  const rawDataByTest = useMemo(() => {
    const map = new Map<string, MessageTestData>()
    for (const testData of rawData) {
      if (testData.testName) {
        map.set(testData.testName, testData)
      }
    }
    return map
  }, [rawData])

  const rawTests = useMemo(() => buildRawTests(rawData), [rawData])
  const contractsByTest = useMemo(() => buildContractsByTest(rawData), [rawData])

  const tests = useMemo((): TestData[] => {
    return rawTests.map(rawTest => {
      const parsedTransactions = rawTest.transactions.transactions.map(
        (it): RawTransactionInfo => ({
          ...it,
          transaction: it.transaction,
          parsedTransaction: loadTransaction(Cell.fromHex(it.transaction).asSlice()),
        }),
      )

      const transactions = processRawTransactions(parsedTransactions)

      const testName = rawTest.testName ?? "unknown"
      const testContracts = contractsByTest.get(testName) ?? []

      const convertedContracts = testContracts.map((it, index): ContractData => {
        const address = Address.parse(it.address)
        const letter = String.fromCharCode(65 + (index % 26))
        const displayName = findContractName(it, testContracts)

        return {
          ...it,
          address,
          stateInit: it.stateInit ? loadStateInit(Cell.fromHex(it.stateInit).asSlice()) : undefined,
          account: loadShardAccount(Cell.fromHex(it.account).asSlice()),
          letter,
          displayName,
          kind: it.meta?.treasurySeed !== undefined ? "treasury" : "user-contract",
        }
      })

      const contracts = new Map(convertedContracts.map(it => [it.address.toString(), it]))

      return {
        testName: rawTest.testName,
        transactions,
        timestamp: rawTest.timestamp,
        contracts,
        changes: rawTest.changes,
        valueFlow: rawTest.valueFlow,
      }
    })
  }, [rawTests, contractsByTest])

  return {
    tests,
    error: "",
    isConnected: false,
    isSharedData: rawData.length > 0,
    rawData,
    rawDataByTest,
    clearFileData,
    loadFromFile,
  }
}
