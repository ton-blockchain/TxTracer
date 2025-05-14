import React from "react"

import {FiGithub, FiBookOpen} from "react-icons/fi"

import SearchInput from "@shared/ui/SearchInput"
import Badge from "@shared/ui/Badge"
import StatusBadge, {type StatusType} from "@shared/ui/StatusBadge"
import {TooltipHint} from "@shared/ui/TooltipHint"
import type {NetworkType} from "@features/txTrace/ui"

import styles from "./TracePageHeader.module.css"

interface TracePageHeaderProps {
  readonly inputValue: string
  readonly onInputChange: (value: string) => void
  readonly onSubmit: () => void
  readonly loading: boolean
  readonly network: NetworkType
  readonly txStatus?: StatusType
  readonly exitCode?: number | undefined
  readonly stateUpdateHashOk?: boolean
}

const TracePageHeaderFc: React.FC<TracePageHeaderProps> = ({
  inputValue,
  onInputChange,
  onSubmit,
  loading,
  network,
  txStatus,
  exitCode,
  stateUpdateHashOk,
}) => {
  const shouldShowStatusContainer = txStatus ?? stateUpdateHashOk === false
  const txStatusText = `Exit code: ${exitCode?.toString() ?? "unknown"}`

  return (
    <header className={styles.header}>
      <div className={styles.logoContainer}>
        <a href="/txtracer-dev" className={styles.logo}>
          <div className={styles.logoDiamond}></div>
          <span className={styles.logoText}>TxTracer</span>
        </a>
        {network === "testnet" && <Badge color="red">Testnet</Badge>}
      </div>

      <div className={styles.searchInputContainer}>
        <SearchInput
          value={inputValue}
          onChange={onInputChange}
          onSubmit={onSubmit}
          placeholder="Trace another transaction hash"
          loading={loading}
          autoFocus={false}
          compact={true}
        />
      </div>

      {shouldShowStatusContainer && (
        <div className={styles.txStatusContainer}>
          {txStatus && <StatusBadge type={txStatus} text={txStatusText} />}
          {stateUpdateHashOk === false && (
            <TooltipHint
              tooltipText={
                "Because the transaction runs in a local sandbox, we can't always reproduce it exactly. Sandbox replay was incomplete, and some values may differ from those on the real blockchain."
              }
              placement="bottom"
            >
              <StatusBadge type="warning" text="Trace Incomplete" />
            </TooltipHint>
          )}
        </div>
      )}

      <div className={styles.headerLinks}>
        <a
          href="https://docs.ton.org/"
          target="_blank"
          rel="noopener noreferrer"
          title="TON Documentation"
          className={styles.iconLink}
        >
          <FiBookOpen size={20} />
        </a>
        <a
          href="https://github.com/tact-lang/txtracer"
          target="_blank"
          rel="noopener noreferrer"
          title="GitHub Repository"
          className={styles.iconLink}
        >
          <FiGithub size={20} />
        </a>
      </div>
    </header>
  )
}

const MemoizedTracePageHeader = React.memo(TracePageHeaderFc)
MemoizedTracePageHeader.displayName = "TracePageHeader"

export default MemoizedTracePageHeader
