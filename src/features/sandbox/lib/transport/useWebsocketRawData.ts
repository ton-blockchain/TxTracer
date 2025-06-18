import {useEffect, useRef, useState, useCallback} from "react"
import {Address, Cell, loadShardAccount, loadStateInit, loadTransaction} from "@ton/core"

import type {ContractData} from "../contract"

import type {TestData} from "../test-data"

import {processRawTransactions, type RawTransactionInfo, type RawTransactions} from "./transaction"
import type {Message, MessageContracts, MessageTransactions} from "./message"

interface UseWebsocketOptions {
  readonly url?: string
  readonly onError?: (error: string) => void
}

interface UseWebsocketReturn {
  readonly tests: TestData[]
  readonly contracts: Map<string, ContractData>
  readonly error: string
  readonly isConnected: boolean
}

function parseMaybeTransactions(data: string): RawTransactions | undefined {
  try {
    return JSON.parse(data) as RawTransactions
  } catch {
    return undefined
  }
}

export function useWebsocketRawData({
  url = "ws://localhost:8081",
  onError,
}: UseWebsocketOptions): UseWebsocketReturn {
  const [tests, setTests] = useState<TestData[]>([])
  const [contracts, setContracts] = useState<Map<string, ContractData>>(new Map())
  const [error, setError] = useState<string>("")
  const [isConnected, setIsConnected] = useState<boolean>(false)
  const currentTestIdRef = useRef(0)

  const handleNextTest = useCallback(() => {
    currentTestIdRef.current += 1
    console.log("New test case:", currentTestIdRef.current)
  }, [])

  const handleTransactions = useCallback((message: MessageTransactions) => {
    const rawTransactions = parseMaybeTransactions(message.data)
    if (!rawTransactions) {
      console.error("Cannot parse transactions:", message)
      return // something went wrong
    }

    const parsedTransactions = rawTransactions.transactions.map(
      (it): RawTransactionInfo => ({
        ...it,
        transaction: it.transaction,
        parsedTransaction: loadTransaction(Cell.fromHex(it.transaction).asSlice()),
      }),
    )

    const testId = currentTestIdRef.current

    const transactions = processRawTransactions(parsedTransactions)

    setTests(prev => {
      const existing = prev.find(test => test.id === testId)
      if (existing) {
        console.log("Updating existing test:", testId)
        return prev.map(test =>
          test.id === testId
            ? {...test, transactions: [...test.transactions, ...transactions]}
            : test,
        )
      } else {
        console.log("Creating new test:", testId)
        return [...prev, {id: testId, testName: message.testName, transactions: transactions}]
      }
    })
  }, [])

  const handleKnownContracts = useCallback((message: MessageContracts) => {
    const newContracts = message.data.map(
      (it): ContractData => ({
        ...it,
        address: Address.parse(it.address),
        stateInit: it.stateInit ? loadStateInit(Cell.fromHex(it.stateInit).asSlice()) : undefined,
        account: loadShardAccount(Cell.fromHex(it.account).asSlice()),
      }),
    )
    setContracts(new Map(newContracts.map(it => [it.address.toString(), it])))
  }, [])

  const handleMessage = useCallback(
    (event: MessageEvent<string>) => {
      const message: Message = JSON.parse(event.data) as Message

      switch (message.$) {
        case "next-test":
          handleNextTest()
          break
        case "txs":
          handleTransactions(message)
          break
        case "known-contracts":
          handleKnownContracts(message)
          break
        default:
          console.warn("Unknown message type:", message)
      }
    },
    [handleNextTest, handleTransactions, handleKnownContracts],
  )

  useEffect(() => {
    const ws = new WebSocket(url)

    ws.onopen = () => {
      setError("")
      setIsConnected(true)
    }

    ws.onmessage = handleMessage

    ws.onerror = () => {
      const errorMessage = "Cannot connect to the daemon. Run: yarn daemon"
      setError(errorMessage)
      setIsConnected(false)
      onError?.(errorMessage)
    }

    ws.onclose = () => {
      setIsConnected(false)
    }

    return () => {
      ws.close()
    }
  }, [url, handleMessage, onError])

  return {
    tests,
    contracts,
    error,
    isConnected,
  }
}
