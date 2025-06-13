import React from "react"

import {FiGithub, FiBookOpen} from "react-icons/fi"

import Badge from "@shared/ui/Badge"
import type {NetworkType} from "@features/txTrace/ui"

import styles from "./PageHeader.module.css"

interface PageHeaderProps {
  readonly pageTitle: string
  readonly network?: NetworkType
  readonly children?: React.ReactNode
}

const PageHeaderFc: React.FC<PageHeaderProps> = ({pageTitle, network, children}) => {
  const isPlayground = pageTitle === "playground"
  const isExplorer = pageTitle === "explorer"

  return (
    <header className={styles.header}>
      <div className={styles.logoContainer}>
        <a href="/" className={styles.logo}>
          <div className={styles.logoDiamond}></div>
          <span className={styles.logoText}>TxTracer</span>
        </a>
        {isPlayground && <span className={styles.pageTitle}>Playground</span>}
        {isExplorer && <span className={styles.pageTitle}>Code Explorer</span>}
        {network === "testnet" && <Badge color="red">Testnet</Badge>}
      </div>

      {children}

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

const MemoizedPageHeader = React.memo(PageHeaderFc)
MemoizedPageHeader.displayName = "PageHeader"

export default MemoizedPageHeader
