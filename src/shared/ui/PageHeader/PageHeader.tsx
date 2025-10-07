import React, {memo} from "react"

import {FiGithub, FiBookOpen} from "react-icons/fi"

import Badge from "@shared/ui/Badge"
import type {NetworkType} from "@features/txTrace/ui"

import styles from "./PageHeader.module.css"

interface PageHeaderProps {
  readonly pageTitle: string
  readonly network?: NetworkType
  readonly children?: React.ReactNode
  readonly titleBadgeText?: string
  readonly titleBadgeColor?: "green" | "red" | "blue" | "gray"
  readonly documentationLink?: string
}

const PageHeaderFc: React.FC<PageHeaderProps> = ({
  pageTitle,
  network,
  children,
  titleBadgeText,
  titleBadgeColor = "gray",
  documentationLink = "https://docs.ton.org/",
}) => {
  const isPlayground = pageTitle === "playground"
  const isExplorer = pageTitle === "explorer"
  const isSandbox = pageTitle === "sandbox"
  const isSpec = pageTitle === "spec"

  return (
    <header className={styles.header} role="banner">
      <div className={styles.logoContainer}>
        <a href="/" className={styles.logo} aria-label="TxTracer home page">
          <div className={styles.logoDiamond} aria-hidden="true"></div>
          <span className={styles.logoText}>TxTracer</span>
        </a>
        {isPlayground && (
          <span className={styles.pageTitle}>
            Playground
            {titleBadgeText && <Badge color={titleBadgeColor}>{titleBadgeText}</Badge>}
          </span>
        )}
        {isExplorer && (
          <span className={styles.pageTitle}>
            Code Explorer
            {titleBadgeText && <Badge color={titleBadgeColor}>{titleBadgeText}</Badge>}
          </span>
        )}
        {isSandbox && (
          <a className={styles.pageTitle} href="/sandbox/">
            Sandbox
            {titleBadgeText && <Badge color={titleBadgeColor}>{titleBadgeText}</Badge>}
          </a>
        )}
        {isSpec && (
          <a className={styles.pageTitle} href="/spec/">
            TVM Instructions
            {titleBadgeText && <Badge color={titleBadgeColor}>{titleBadgeText}</Badge>}
          </a>
        )}
        {network === "testnet" && <Badge color="red">Testnet</Badge>}
      </div>

      {children}

      <nav className={styles.headerLinks} aria-label="External links">
        <a
          href={documentationLink}
          target="_blank"
          rel="noopener noreferrer"
          title="TON Documentation"
          className={styles.iconLink}
          aria-label="Open TON Documentation in new tab"
        >
          <FiBookOpen size={20} aria-hidden="true" />
        </a>
        <a
          href="https://github.com/ton-blockchain/txtracer"
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

const MemoizedPageHeader = memo(PageHeaderFc)
MemoizedPageHeader.displayName = "PageHeader"

export default MemoizedPageHeader
