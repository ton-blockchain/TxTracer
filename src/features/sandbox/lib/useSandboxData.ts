import {useMemo} from "react"
import {Address, Cell, loadShardAccount, loadStateInit, loadTransaction} from "@ton/core"

import type {ContractRawData} from "@features/sandbox/lib/transport/contract.ts"

import type {MessageTestData} from "@features/sandbox/lib/transport/message.ts"

import {useWebsocket} from "./transport/useWebsocket"
import {processRawTransactions, type RawTransactionInfo} from "./transport/transaction"
import type {ContractData} from "./contract"
import type {TestData} from "./test-data"

interface UseSandboxDataOptions {
  readonly url?: string
  readonly onError?: (error: string) => void
}

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

export function useSandboxData(options: UseSandboxDataOptions = {}): UseSandboxDataReturn {
  const rawData = useWebsocket(options)

  const rawDataByTest = useMemo(() => {
    const map = new Map<string, MessageTestData>()
    for (const testData of rawData.rawData) {
      if (testData.testName) {
        map.set(testData.testName, testData)
      }
    }
    return map
  }, [rawData.rawData])

  const tests = useMemo((): TestData[] => {
    return rawData.tests.map(rawTest => {
      const parsedTransactions = rawTest.transactions.transactions.map(
        (it): RawTransactionInfo => ({
          ...it,
          transaction: it.transaction,
          parsedTransaction: loadTransaction(Cell.fromHex(it.transaction).asSlice()),
        }),
      )

      const transactions = processRawTransactions(parsedTransactions)

      const testName = rawTest.testName ?? "unknown"
      const testContracts = rawData.contractsByTest.get(testName) ?? []

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
  }, [rawData.tests, rawData.contractsByTest])

  return {
    tests,
    error: rawData.error,
    isConnected: rawData.isConnected,
    isSharedData: rawData.rawData.length > 0,
    rawData: rawData.rawData,
    rawDataByTest,
    clearFileData: rawData.clearFileData,
    loadFromFile: rawData.loadFromFile,
  }
}
