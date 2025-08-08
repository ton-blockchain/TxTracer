import React, {useCallback, useState} from "react"

import Button from "@shared/ui/Button"

import type {MessageTestData} from "@features/sandbox/lib/transport/message.ts"

import styles from "../SandboxPage.module.css"

import {SANDBOX_EXAMPLES, fetchExampleData} from "./examples"

interface ExampleDataButtonsProps {
  readonly onDataLoaded: (data: MessageTestData[]) => void
}

export const ExampleDataButtons: React.FC<ExampleDataButtonsProps> = ({onDataLoaded}) => {
  const [loadingKey, setLoadingKey] = useState<string | null>(null)
  const [errorKey, setErrorKey] = useState<string | null>(null)

  const handleLoad = useCallback(
    async (file: string) => {
      setErrorKey(null)
      setLoadingKey(file)
      try {
        const data = await fetchExampleData(file)
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
        {SANDBOX_EXAMPLES.map(ex => {
          const href = `?example=${encodeURIComponent(ex.key)}`
          const isLoading = loadingKey === ex.file
          const isError = errorKey === ex.file
          return (
            <a key={ex.file} href={href} onClick={e => e.stopPropagation()}>
              <Button
                className={`${styles.uploadButton} ${isError ? styles.error : isLoading ? styles.uploaded : ""}`}
                title={`Load example: ${ex.label}`}
                aria-label={`Load example: ${ex.label}`}
                onClick={() => void handleLoad(ex.file)}
              >
                {isLoading ? "Loading..." : isError ? "Error" : ex.label}
              </Button>
            </a>
          )
        })}
      </div>
    </div>
  )
}

export default ExampleDataButtons
