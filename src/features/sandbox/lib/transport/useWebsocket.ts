import {useEffect, useState, useCallback} from "react"

import type {Message, MessageTestData} from "./message"
import type {RawTransactions} from "./transaction"
import type {ContractRawData} from "./contract"

type TestData = {
  readonly testName: string
  readonly transactions: RawTransactions
  readonly timestamp?: number
}

export interface RawWebsocketData {
  readonly tests: TestData[]
  readonly contractsByTest: Map<string, readonly ContractRawData[]>
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
  const [contractsByTest, setContractsByTest] = useState<Map<string, readonly ContractRawData[]>>(
    new Map(),
  )
  const [error, setError] = useState<string>("")
  const [isConnected, setIsConnected] = useState<boolean>(false)

  function parseMaybeTransactions(data: string): RawTransactions | undefined {
    try {
      return JSON.parse(data) as RawTransactions
    } catch {
      return undefined
    }
  }

  const handleTestData = useCallback((message: MessageTestData) => {
    const rawTransactions = parseMaybeTransactions(message.transactions)
    if (!rawTransactions) {
      console.error("Cannot parse transactions:", message)
      return
    }

    const testName = message.testName ?? `unknown #${tests.length}`

    setContractsByTest(prev => {
      const newMap = new Map(prev)
      newMap.set(testName, message.contracts)
      return newMap
    })

    setTests(prev => {
      const existing = prev.find(test => test.testName === testName)
      if (existing) {
        console.log("Updating existing test:", testName)
        return prev.map(test =>
          test.testName === testName
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
        console.log("Creating new test:", testName)
        return [
          ...prev,
          {
            testName,
            transactions: rawTransactions,
            timestamp: Date.now(),
          },
        ]
      }
    })
  }, [tests.length])

  const handleMessage = useCallback(
    (event: MessageEvent<string>) => {
      const message: Message = JSON.parse(event.data) as Message

      switch (message.$) {
        case "test-data":
          handleTestData(message)
          break
        default:
          console.warn("Unknown message type:", message)
      }
    },
    [handleTestData],
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
    contractsByTest,
    error,
    isConnected,
  }
}
