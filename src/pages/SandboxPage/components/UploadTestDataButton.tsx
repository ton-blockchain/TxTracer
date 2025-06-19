import React, {useCallback, useRef, useState} from "react"
import {FiUpload, FiCheck, FiAlertCircle} from "react-icons/fi"

import Button from "@shared/ui/Button"

import type {MessageTestData} from "@features/sandbox/lib/transport/message.ts"

import styles from "../SandboxPage.module.css"

interface UploadTestDataButtonProps {
  readonly onDataLoaded: (data: MessageTestData[]) => void
}

export const UploadTestDataButton: React.FC<UploadTestDataButtonProps> = ({onDataLoaded}) => {
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const className = `${styles.uploadButton} ${
    status === "success" ? styles.uploaded : status === "error" ? styles.error : ""
  }`

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = () => {
        try {
          const jsonString = reader.result as string
          const data = JSON.parse(jsonString) as MessageTestData[]

          onDataLoaded(data)
          setStatus("success")
          setTimeout(() => setStatus("idle"), 2000)
        } catch (error) {
          console.error("Error parsing uploaded file:", error)
          setStatus("error")
          setTimeout(() => setStatus("idle"), 3000)
        }
      }
      reader.onerror = () => {
        setStatus("error")
        setTimeout(() => setStatus("idle"), 3000)
      }
      reader.readAsText(file)

      event.target.value = ""
    },
    [onDataLoaded],
  )

  const handleButtonClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const getButtonText = () => {
    switch (status) {
      case "success":
        return "Loaded!"
      case "error":
        return "Error"
      default:
        return "Upload"
    }
  }

  const getIcon = () => {
    switch (status) {
      case "success":
        return <FiCheck size={16} aria-hidden="true" />
      case "error":
        return <FiAlertCircle size={16} aria-hidden="true" />
      default:
        return <FiUpload size={16} aria-hidden="true" />
    }
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileSelect}
        style={{display: "none"}}
        aria-label="Upload test data JSON file"
      />
      <Button
        onClick={handleButtonClick}
        title="Upload test data from JSON file"
        className={className}
        aria-label="Upload test data from JSON file"
      >
        {getIcon()}
        {getButtonText()}
      </Button>

      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {status === "success" && "Test data loaded successfully"}
        {status === "error" && "Error loading test data file"}
      </div>
    </>
  )
}

export default UploadTestDataButton
