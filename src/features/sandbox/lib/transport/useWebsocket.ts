import {useEffect, useRef, useState, useCallback} from "react"

import type {Message, MessageContracts, MessageTransactions} from "./message"
import type {RawTransactions} from "./transaction"
import type {ContractRawData} from "./contract"

type TestData = {
  readonly id: number
  readonly testName: string | undefined
  readonly transactions: RawTransactions
}

export interface RawWebsocketData {
  readonly tests: TestData[]
  readonly contracts: readonly ContractRawData[]
  readonly error: string
  readonly isConnected: boolean
}

interface UseWebsocketOptions {
  readonly url?: string
  readonly onError?: (error: string) => void
}

export function useWebsocket({
  url = "ws://localhost:8081",
  onError,
}: UseWebsocketOptions = {}): RawWebsocketData {
  const [tests, setTests] = useState<TestData[]>([])
  const [contracts, setContracts] = useState<readonly ContractRawData[]>([])
  const [error, setError] = useState<string>("")
  const [isConnected, setIsConnected] = useState<boolean>(false)
  const currentTestIdRef = useRef(0)

  const handleNextTest = useCallback(() => {
    currentTestIdRef.current += 1
    console.log("New test case:", currentTestIdRef.current)
  }, [])

  function parseMaybeTransactions(data: string): RawTransactions | undefined {
    try {
      return JSON.parse(data) as RawTransactions
    } catch {
      return undefined
    }
  }

  const handleTransactions = useCallback((message: MessageTransactions) => {
    const rawTransactions = parseMaybeTransactions(message.data)
    if (!rawTransactions) {
      console.error("Cannot parse transactions:", message)
      return
    }

    const testId = currentTestIdRef.current

    setTests(prev => {
      const existing = prev.find(test => test.id === testId)
      if (existing) {
        console.log("Updating existing test:", testId)
        return prev.map(test =>
          test.id === testId
            ? {
                ...test,
                transactions: {
                  transactions: [
                    ...test.transactions.transactions,
                    ...rawTransactions.transactions,
                  ],
                },
              }
            : test,
        )
      } else {
        console.log("Creating new test:", testId)
        return [
          ...prev,
          {
            id: testId,
            testName: message.testName,
            transactions: rawTransactions,
          },
        ]
      }
    })
  }, [])

  const handleKnownContracts = useCallback((message: MessageContracts) => {
    setContracts(message.data)
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
