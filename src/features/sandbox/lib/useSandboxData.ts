import {useMemo} from "react"
import {Address, Cell, loadShardAccount, loadStateInit, loadTransaction} from "@ton/core"

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
  readonly contracts: Map<string, ContractData>
  readonly error: string
  readonly isConnected: boolean
}

export function useSandboxData(options: UseSandboxDataOptions = {}): UseSandboxDataReturn {
  const rawData = useWebsocket(options)

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

      return {
        id: rawTest.id,
        testName: rawTest.testName,
        transactions,
      }
    })
  }, [rawData.tests])

  const contracts = useMemo((): Map<string, ContractData> => {
    const convertedContracts = rawData.contracts.map(
      (it): ContractData => ({
        ...it,
        address: Address.parse(it.address),
        stateInit: it.stateInit ? loadStateInit(Cell.fromHex(it.stateInit).asSlice()) : undefined,
        account: loadShardAccount(Cell.fromHex(it.account).asSlice()),
      }),
    )

    return new Map(convertedContracts.map(it => [it.address.toString(), it]))
  }, [rawData.contracts])

  return {
    tests,
    contracts,
    error: rawData.error,
    isConnected: rawData.isConnected,
  }
}
