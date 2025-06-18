import {useState, useCallback, useEffect} from "react"

import type {ContractData} from "@features/sandbox/lib/contract.ts"

import styles from "./ContractChip.module.css"

export function ContractChip({
  address,
  contracts,
  onContractClick,
}: {
  address: string | undefined
  contracts: Map<string, ContractData>
  onContractClick?: (address: string) => void
}) {
  const [isCopied, setIsCopied] = useState(false)

  const handleCopy = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      if (address) {
        navigator.clipboard
          .writeText(address)
          .then(() => {
            setIsCopied(true)
          })
          .catch(err => {
            console.error("Failed to copy: ", err)
          })
      }
    },
    [address],
  )

  const handleChipClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      if (address && onContractClick) {
        onContractClick(address)
      }
    },
    [address, onContractClick],
  )

  useEffect(() => {
    if (isCopied) {
      const timer = setTimeout(() => {
        setIsCopied(false)
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [isCopied])

  const copyIconSvg = (
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
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  )

  if (!address) {
    return <span className={styles.contractChip}>Unknown</span>
  }

  const contractInfo = contracts.get(address)
  const isClickable = !!onContractClick

  const chipContent = (
    <>
      {contractInfo ? (
        <>
          <span className={styles.contractLetter}>{contractInfo.letter}</span>
          <span className={styles.contractName}>{contractInfo.displayName}</span>
          <span className={styles.contractAddress}>
            ({address.slice(0, 6)}…{address.slice(-6)})
          </span>
        </>
      ) : (
        <span className={styles.contractAddress}>
          {address.slice(0, 6)}…{address.slice(-6)}
        </span>
      )}
      <button
        onClick={handleCopy}
        className={styles.contractChipCopyButton}
        title={isCopied ? "Copied!" : "Copy address"}
        aria-label={isCopied ? "Copied to clipboard" : "Copy address"}
        disabled={isCopied}
        type="button"
      >
        {isCopied ? checkIconSvg : copyIconSvg}
      </button>
    </>
  )

  if (isClickable) {
    return (
      <button
        className={`${styles.contractChip} ${styles.clickable}`}
        onClick={handleChipClick}
        title="Click to view contract details"
        type="button"
      >
        {chipContent}
      </button>
    )
  }

  return <span className={styles.contractChip}>{chipContent}</span>
}
