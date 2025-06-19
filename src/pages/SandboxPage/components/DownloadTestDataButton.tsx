import React, {useCallback, useState} from "react"
import {FiDownload, FiCheck} from "react-icons/fi"

import Button from "@shared/ui/Button"

import type {MessageTestData} from "@features/sandbox/lib/transport/message.ts"

import styles from "../SandboxPage.module.css"

interface DownloadTestDataButtonProps {
  readonly rawData: MessageTestData[]
}

export const DownloadTestDataButton: React.FC<DownloadTestDataButtonProps> = ({rawData}) => {
  const [isDownloaded, setIsDownloaded] = useState(false)

  const className = `${styles.downloadButton} ${isDownloaded ? styles.downloaded : ""}`

  const handleDownloadTestData = useCallback(() => {
    const jsonString = JSON.stringify(rawData, null, 2)
    const blob = new Blob([jsonString], {type: "application/json"})
    const url = URL.createObjectURL(blob)

    const testName = rawData.at(0)?.testName ?? "unknown-test"

    const link = document.createElement("a")
    link.href = url
    link.download = `sandbox-${testName}-${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    setIsDownloaded(true)
    setTimeout(() => setIsDownloaded(false), 1000)
  }, [rawData])

  return (
    <>
      <Button
        onClick={handleDownloadTestData}
        title={isDownloaded ? "Downloaded!" : "Download test data as JSON"}
        className={className}
        aria-label={isDownloaded ? "Test data downloaded" : "Download test data as JSON"}
      >
        {isDownloaded ? (
          <FiCheck size={16} aria-hidden="true" />
        ) : (
          <FiDownload size={16} aria-hidden="true" />
        )}
        {isDownloaded ? "Downloaded!" : "Download"}
      </Button>

      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {isDownloaded && "Test data downloaded as JSON file"}
      </div>
    </>
  )
}

export default DownloadTestDataButton
