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
  const isSandbox = pageTitle === "sandbox"

  return (
    <header className={styles.header} role="banner">
      <div className={styles.logoContainer}>
        <a href="/" className={styles.logo} aria-label="TxTracer home page">
          <div className={styles.logoDiamond} aria-hidden="true"></div>
          <span className={styles.logoText}>TxTracer</span>
        </a>
        {isPlayground && <span className={styles.pageTitle}>Playground</span>}
        {isExplorer && <span className={styles.pageTitle}>Code Explorer</span>}
        {isSandbox && <span className={styles.pageTitle}>Sandbox</span>}
        {network === "testnet" && <Badge color="red">Testnet</Badge>}
      </div>

      {children}

      <nav className={styles.headerLinks} aria-label="External links">
        <a
          href="https://docs.ton.org/"
          target="_blank"
          rel="noopener noreferrer"
          title="TON Documentation"
          className={styles.iconLink}
          aria-label="Open TON Documentation in new tab"
        >
          <FiBookOpen size={20} aria-hidden="true" />
        </a>
        <a
          href="https://github.com/tact-lang/txtracer"
          target="_blank"
          rel="noopener noreferrer"
          title="GitHub Repository"
          className={styles.iconLink}
          aria-label="Open TxTracer GitHub repository in new tab"
        >
          <FiGithub size={20} aria-hidden="true" />
        </a>
      </nav>
    </header>
  )
}

const MemoizedPageHeader = React.memo(PageHeaderFc)
MemoizedPageHeader.displayName = "PageHeader"

export default MemoizedPageHeader
