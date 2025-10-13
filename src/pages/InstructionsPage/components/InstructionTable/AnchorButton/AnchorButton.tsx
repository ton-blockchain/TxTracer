import React, {useCallback, useEffect, useState} from "react"

import Icon from "@shared/ui/Icon"

import styles from "./AnchorButton.module.css"

export const AnchorButton: React.FC<{
  readonly value: string
  readonly title: string
  readonly className?: string
}> = ({value, title, className}) => {
  const [isCopied, setIsCopied] = useState(false)

  const handleCopy = useCallback(() => {
    const url = `${window.location.origin}${window.location.pathname}#${value}`

    navigator.clipboard
      .writeText(url)
      .then(() => {
        setIsCopied(true)
      })
      .catch(err => {
        console.error("Failed to copy URL:", err)
      })
  }, [value])

  useEffect(() => {
    if (isCopied) {
      const timer = setTimeout(() => {
        setIsCopied(false)
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [isCopied])

  const linkIconSvg = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  )

  const checkIconSvg = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  )

  return (
    <>
      <button
        onClick={e => {
          e.stopPropagation()
          handleCopy()
        }}
        className={`${styles.anchorButton} ${isCopied ? styles.copied : ""} ${className ?? ""}`}
        title={isCopied ? "Copied!" : title}
        aria-label={isCopied ? "Copied to clipboard" : `Copy ${title.toLowerCase()}`}
        disabled={isCopied}
        type="button"
      >
        <Icon svg={isCopied ? checkIconSvg : linkIconSvg} />
      </button>

      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {isCopied && "Copied to clipboard"}
      </div>
    </>
  )
}
