import {useEffect, useState, useCallback} from "react"

import {useGlobalError} from "@shared/lib/useGlobalError.tsx"

import type {Message, MessageTestData, ValueFlow} from "./message"
import type {RawTransactions} from "./transaction"
import type {ContractRawData, ContractStateChange} from "./contract"

interface TestData {
  readonly testName: string
  readonly transactions: RawTransactions
  readonly timestamp?: number
  readonly changes: readonly ContractStateChange[]
  readonly valueFlow?: Map<string, ValueFlow>
}

export interface RawWebsocketData {
  readonly tests: TestData[]
  readonly contractsByTest: Map<string, readonly ContractRawData[]>
  readonly error: string
  readonly isConnected: boolean
  readonly rawData: MessageTestData[]
  readonly loadFromFile: (data: MessageTestData[]) => void
  readonly clearFileData: () => void
}

interface UseWebsocketOptions {
  readonly url?: string
  readonly onError?: (error: string) => void
}

export function useWebsocket({
  url = "ws://localhost:7743",
  onError,
}: UseWebsocketOptions = {}): RawWebsocketData {
  const [tests, setTests] = useState<TestData[]>([])
  const [contractsByTest, setContractsByTest] = useState<Map<string, readonly ContractRawData[]>>(
    new Map(),
  )
  const [error, setError] = useState<string>("")
  const [isConnected, setIsConnected] = useState<boolean>(false)
  const [fromFile, setFromFile] = useState<boolean>(false)
  const {setError: setGlobalError} = useGlobalError()

  const loadFromFile = useCallback((data: MessageTestData[]) => {
    setRawData(data)
    setFromFile(true)
  }, [])

  const clearFileData = useCallback(() => {
    setRawData([])
    setContractsByTest(new Map())
    setTests([])
  }, [])

  const [rawData, setRawData] = useState<MessageTestData[]>([])

  function parseMaybeTransactions(data: string): RawTransactions | undefined {
    try {
      return JSON.parse(data) as RawTransactions
    } catch {
      return undefined
    }
  }

  const handleTestData = useCallback((message: MessageTestData, fromTaw: boolean) => {
    if (!fromTaw) {
      setRawData(prev => [...prev, message])
    }

    const rawTransactions = parseMaybeTransactions(message.transactions)
    if (!rawTransactions) {
      console.error("Cannot parse transactions:", message)
      return
    }

    const testName = message.testName ?? `unknown`

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
                changes: [...test.changes, ...message.changes],
                valueFlow: test.valueFlow,
              }
            : test,
        )
      } else {
        return [
          ...prev,
          {
            testName,
            transactions: rawTransactions,
            timestamp: Date.now(),
            changes: message.changes,
            valueFlow: message.valueFlow,
          },
        ]
      }
    })
  }, [])

  const handleMessage = useCallback(
    (event: MessageEvent<string>) => {
      const message: Message = JSON.parse(event.data) as Message

      switch (message.$) {
        case "test-data":
          handleTestData(message, false)
          break
        default:
          console.warn("Unknown message type:", message)
      }
    },
    [handleTestData],
  )

  const handleLocalData = useCallback(
    (message: Message) => {
      switch (message.$) {
        case "test-data":
          handleTestData(message, true)
          break
        default:
          console.warn("Unknown message type:", message)
      }
    },
    [handleTestData],
  )

  useEffect(() => {
    if (fromFile) {
      for (const data of rawData) {
        handleLocalData(data)
      }
    }
  }, [handleLocalData, fromFile, rawData])

  useEffect(() => {
    let ws: WebSocket | null = null
    try {
      ws = new WebSocket(url)
    } catch (err) {
      let errorMessage = ""
      if (err instanceof Error) {
        errorMessage = err.message
      } else {
        throw err
      }

      setGlobalError(errorMessage)
      setError(errorMessage)
      setIsConnected(false)
      return
    }

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
  }, [url, handleMessage, onError, setGlobalError])

  return {
    tests,
    contractsByTest,
    error,
    isConnected,
    rawData,
    loadFromFile,
    clearFileData,
  }
}
