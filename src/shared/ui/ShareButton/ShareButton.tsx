import React, {useCallback, useState} from "react"
import {FiShare2, FiCheck} from "react-icons/fi"

import Button from "@shared/ui/Button"
import {encodeCodeToUrl} from "@app/pages/GodboltPage/urlCodeSharing.ts"
import styles from "@app/pages/GodboltPage/GodboltPage.module.css"

interface ShareButtonProps {
  readonly value: string
  readonly lang?: "func" | "tolk" | "tasm"
  readonly stack?: string
}

export const ShareButton: React.FC<ShareButtonProps> = ({value, lang, stack}) => {
  const [isCopied, setIsCopied] = useState(false)

  const className = `${styles.shareButton} ${isCopied ? styles.copied : ""}`

  const handleShareCode = useCallback(async () => {
    const shareUrl = encodeCodeToUrl(value, lang, stack ? {stack} : undefined)

    try {
      await navigator.clipboard.writeText(shareUrl)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 1000)
      console.log("Share URL copied to clipboard:", shareUrl)
    } catch (error) {
      console.error("Failed to copy to clipboard:", error)
      const textArea = document.createElement("textarea")
      textArea.value = shareUrl
      document.body.appendChild(textArea)
      textArea.select()
      const success = document.execCommand("copy")
      document.body.removeChild(textArea)

      if (success) {
        setIsCopied(true)
        setTimeout(() => setIsCopied(false), 1000)
      }
    }
  }, [value, lang, stack])

  return (
    <>
      <Button
        onClick={() => void handleShareCode()}
        title={isCopied ? "Link copied!" : "Share code via URL"}
        className={className}
        aria-label={isCopied ? "Code link copied to clipboard" : "Share code via URL"}
        data-testid="share-button"
      >
        {isCopied ? (
          <FiCheck size={16} aria-hidden="true" />
        ) : (
          <FiShare2 size={16} aria-hidden="true" />
        )}
        {isCopied ? "Copied!" : "Share"}
      </Button>

      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {isCopied && "Share link copied to clipboard"}
      </div>
    </>
  )
}

export default ShareButton
