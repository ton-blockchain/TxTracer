import React, {useCallback, useState, useEffect} from "react"

import Icon from "@shared/ui/Icon"

import styles from "./AddressChip.module.css"

export interface AddressChipProps {
  readonly address: string
  readonly className?: string
}

const AddressChip: React.FC<AddressChipProps> = ({address, className}) => {
  const [isCopied, setIsCopied] = useState(false)

  const handleCopy = useCallback(() => {
    navigator.clipboard
      .writeText(address)
      .then(() => {
        setIsCopied(true)
      })
      .catch(err => {
        console.error("Failed to copy address: ", err)
      })
  }, [address])

  useEffect(() => {
    if (isCopied) {
      const timer = setTimeout(() => {
        setIsCopied(false)
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [isCopied])

  const chipClassName = `${styles.addressValue} ${className || ""}`.trim()

  const copyIconSvg = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
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
    >
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  )

  return (
    <span className={chipClassName} title={address}>
      {address}
      <button
        onClick={handleCopy}
        className={`${styles.copyIcon} ${isCopied ? styles.copied : ""}`}
        title={isCopied ? "Copied!" : "Copy address"}
        disabled={isCopied}
      >
        <Icon svg={isCopied ? checkIconSvg : copyIconSvg} />
      </button>
    </span>
  )
}

export default AddressChip
