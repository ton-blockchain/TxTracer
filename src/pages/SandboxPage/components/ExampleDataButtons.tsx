import React, {useCallback, useState} from "react"

import Button from "@shared/ui/Button"

import type {MessageTestData} from "@features/sandbox/lib/transport/message.ts"

import styles from "../SandboxPage.module.css"

interface ExampleDataButtonsProps {
  readonly onDataLoaded: (data: MessageTestData[]) => void
}

const EXAMPLES: ReadonlyArray<{label: string; file: string}> = [
  {
    label: "Tolk: Counter",
    file: "tolk-sandbox-Counter should reset counter-2025-08-07T20-11-27.json",
  },
  {
    label: "Tact: Proofs TEP89",
    file: "tact-sandbox-Proofs TEP89 proof should correctly work for discoverable jettons-2025-08-08T08-23-05.json",
  },
]

export const ExampleDataButtons: React.FC<ExampleDataButtonsProps> = ({onDataLoaded}) => {
  const [loadingKey, setLoadingKey] = useState<string | null>(null)
  const [errorKey, setErrorKey] = useState<string | null>(null)

  const handleLoad = useCallback(
    async (file: string) => {
      setErrorKey(null)
      setLoadingKey(file)
      try {
        const url = `/assets/sandbox-examples/${encodeURIComponent(file)}`
        const res = await fetch(url)
        if (!res.ok) throw new Error(`Failed to fetch example: ${res.status}`)
        const data = (await res.json()) as MessageTestData[]
        onDataLoaded(data)
      } catch (e) {
        console.error(e)
        setErrorKey(file)
      } finally {
        setLoadingKey(null)
      }
    },
    [onDataLoaded],
  )

  return (
    <div className={styles.examplesContainer}>
      <span className={styles.examplesTitle}>Or try examples:</span>
      <div className={styles.examplesList}>
        {EXAMPLES.map(ex => (
          <Button
            key={ex.file}
            onClick={() => void handleLoad(ex.file)}
            className={`${styles.uploadButton} ${
              errorKey === ex.file ? styles.error : loadingKey === ex.file ? styles.uploaded : ""
            }`}
            title={`Load example: ${ex.label}`}
            aria-label={`Load example: ${ex.label}`}
          >
            {loadingKey === ex.file ? "Loading..." : errorKey === ex.file ? "Error" : ex.label}
          </Button>
        ))}
      </div>
    </div>
  )
}

export default ExampleDataButtons
