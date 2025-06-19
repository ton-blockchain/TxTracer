import {Cell, type Message} from "@ton/core"
import {decompileCell} from "ton-assembly-test-dev/dist/runtime/instr"
import {print} from "ton-assembly-test-dev/dist/text"
import {useState} from "react"
import type {Maybe} from "@ton/core/dist/utils/maybe"

import {formatCurrency} from "@shared/lib/format"
import {ContractChip, OpcodeChip, CodeBlock} from "@app/pages/SandboxPage/components"
import type {TestData} from "@features/sandbox/lib/test-data.ts"
import {findOpcodeABI, type TransactionInfo} from "@features/sandbox/lib/transaction.ts"
import type {ContractData} from "@features/sandbox/lib/contract"
import {parseSliceWithAbiType} from "@features/sandbox/lib/abi/parser.ts"

import {ParsedDataView} from "@features/sandbox/ui/abi"

import styles from "./ContractDetails.module.css"

export interface ContractDetailsProps {
  /** Contract data including address, state init and metadata */
  readonly contract: ContractData
  /** All contracts map for cross-referencing */
  readonly contracts: Map<string, ContractData>
  /** Test data containing transactions */
  readonly tests: TestData[]
  /** Whether contract was deployed during tests */
  readonly isDeployed: boolean
}

function findTransactions(tests: TestData[], contract: ContractData) {
  return tests.flatMap(it => {
    return it.transactions.filter(transaction => {
      if (!transaction.address) return false
      return transaction.address.toString() === contract.address.toString()
    })
  })
}

const truncateMiddle = (text: string, maxLength: number = 30) => {
  if (text.length <= maxLength) return <>{text}</>

  const partLength = Math.floor(maxLength / 2)
  const start = text.substring(0, partLength)
  const end = text.substring(text.length - partLength)

  return (
    <span title={text} className={styles.truncatedMiddle}>
      {start}
      <span className={styles.ellipsis}>…</span>
      {end}
    </span>
  )
}

function inMessageView(inMessage: Maybe<Message>, contracts?: Map<string, ContractData>) {
  if (!inMessage) {
    return <span className={styles.addressShort}>—</span>
  }

  if (inMessage.info.type === "internal") {
    const src = inMessage.info.src

    return (
      <div className={styles.inMessage}>
        {contracts ? (
          <>
            <ContractChip address={src.toString()} contracts={contracts} />
          </>
        ) : (
          <>
            <span className={styles.addressShort}>{truncateMiddle(src.toString(), 10)}</span>
          </>
        )}
      </div>
    )
  }

  if (inMessage.info.type === "external-in") {
    const src = inMessage.info.src

    return (
      <div className={styles.inMessage}>
        {contracts ? (
          <>
            <ContractChip address={src?.toString()} contracts={contracts} />
          </>
        ) : (
          <>
            <span className={styles.addressShort}>
              {truncateMiddle(src?.toString() ?? "unknown", 10)}
            </span>
          </>
        )}
      </div>
    )
  }

  return <span className={styles.addressShort}>External</span>
}

function findConstructorAbiType(data: ContractData, name: string) {
  return data.meta?.abi?.types?.find(it => it.name === `${name}$Data`)
}

function getStateInit(data: ContractData) {
  const initData = data.stateInit?.data
  if (initData) {
    const copy = Cell.fromHex(initData.toBoc().toString("hex"))
    const name = data.meta?.wrapperName
    if (!name) return undefined

    const abi = findConstructorAbiType(data, name)
    if (abi) {
      console.log(`found abi data for ${data.meta?.wrapperName ?? "unknown contract"}`)
      return parseSliceWithAbiType(copy.asSlice(), abi, data.meta?.abi?.types ?? [])
    }

    const otherName =
      name === "ExtendedShardedJettonWallet"
        ? "JettonWalletSharded"
        : name === "ExtendedShardedJettonMinter"
          ? "JettonMinterSharded"
          : name

    const abi2 = findConstructorAbiType(data, otherName)
    if (abi2) {
      console.log(`found abi data for ${data.meta?.wrapperName ?? "unknown contract"}`)
      return parseSliceWithAbiType(copy.asSlice(), abi2, data.meta?.abi?.types ?? [])
    }

    console.log(`no abi data for ${data.meta?.wrapperName ?? "unknown contract"}`)
  }
  return undefined
}

function TxTableLine({tx, contracts}: {tx: TransactionInfo; contracts: Map<string, ContractData>}) {
  const opcode = tx.opcode
  const abiType = findOpcodeABI(tx, contracts)
  const inMessage = tx.transaction.inMessage

  const value = inMessage?.info?.type === "internal" ? inMessage?.info.value?.coins : undefined
  const isExternalIn = inMessage?.info?.type === "external-in"

  return (
    <div className={styles.txTableLine}>
      <div className={styles.txTableCellOpcode}>
        <OpcodeChip opcode={opcode} abiName={abiType?.name} />
        {isExternalIn && <span className={styles.externalInLabel}> (external-in)</span>}
      </div>
      <div className={styles.txTableCell}>{inMessageView(inMessage, contracts)}</div>
      <div className={`${styles.txTableCell} ${styles.txTableCellValue}`}>
        {formatCurrency(value)}
      </div>
    </div>
  )
}

export function ContractDetails({
  contract,
  contracts,
  tests,
  isDeployed: _isDeployed,
}: ContractDetailsProps) {
  const [activeTab, setActiveTab] = useState<"history" | "code" | "state-init">("history")

  const address = contract.address.toString()
  const balance = formatCurrency(contract.account.account?.storage?.balance?.coins)
  const contractType =
    (contract.meta?.treasurySeed ? "Treasury" : contract.meta?.wrapperName) ?? "Unknown contract"

  const state = contract.account.account?.storage?.state?.type ?? "unknown"

  const getStatusClass = (state: string) => {
    switch (state) {
      case "active":
        return `${styles.mainInformationStatus} ${styles.active}`
      case "frozen":
        return `${styles.mainInformationStatus} ${styles.frozen}`
      case "uninit":
      case "unknown":
      default:
        return `${styles.mainInformationStatus} ${styles.inactive}`
    }
  }

  const stateInit = getStateInit(contract)

  const ownTransactions = findTransactions(tests, contract)

  const assembly = contract.stateInit?.code ? print(decompileCell(contract.stateInit?.code)) : ""
  const codeHex = contract.stateInit?.code?.toBoc()?.toString("hex") ?? ""
  const stateInitHex = contract.stateInit?.data?.toBoc()?.toString("hex") ?? ""
  const stateInitCell = contract.stateInit?.data?.toString() ?? ""

  const renderStateInit = () => {
    if (!stateInit) return null
    return <ParsedDataView data={stateInit} contracts={contracts} />
  }

  return (
    <div className={styles.container}>
      <div className={styles.mainInformation}>
        <div className={styles.contractChipHeader}>
          <ContractChip address={address} contracts={contracts} />
        </div>

        <div className={styles.mainInformationRows}>
          <div className={styles.mainInformationRowTitle}>Address</div>
          <div>{address}</div>
          <div className={styles.mainInformationRowTitle}>Balance</div>
          <div>{balance}</div>
          <div className={styles.mainInformationRowTitle}>Contract type</div>
          <div>{contractType}</div>
        </div>

        <div className={styles.mainInformationFooter}>
          <div className={getStatusClass(state)}>{state}</div>
        </div>
      </div>

      <div className={styles.detailsInformation}>
        <div className={styles.tabsContainer}>
          <div
            className={`${styles.tab} ${activeTab === "history" ? styles.active : ""}`}
            onClick={() => setActiveTab("history")}
            onKeyDown={e => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                setActiveTab("history")
              }
            }}
            role="button"
            tabIndex={0}
          >
            History
          </div>
          <div
            className={`${styles.tab} ${activeTab === "code" ? styles.active : ""}`}
            onClick={() => setActiveTab("code")}
            onKeyDown={e => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                setActiveTab("code")
              }
            }}
            role="button"
            tabIndex={0}
          >
            Code
          </div>
          <div
            className={`${styles.tab} ${activeTab === "state-init" ? styles.active : ""}`}
            onClick={() => setActiveTab("state-init")}
            onKeyDown={e => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                setActiveTab("state-init")
              }
            }}
            role="button"
            tabIndex={0}
          >
            State Init
          </div>
        </div>

        <div className={styles.tabContent}>
          {activeTab === "history" && (
            <>
              <div className={styles.txTableHeader}>
                <div className={styles.txTableHeaderCell}>Operation</div>
                <div className={styles.txTableHeaderCell}>From</div>
                <div className={`${styles.txTableHeaderCell} ${styles.txTableHeaderCellValue}`}>
                  Value
                </div>
              </div>
              {ownTransactions.length > 0 ? (
                ownTransactions.map((tx, index) => (
                  <TxTableLine key={index} tx={tx} contracts={contracts} />
                ))
              ) : (
                <div className={styles.txTableLine}>
                  <div className={`${styles.txTableCell} ${styles.noTransactionsMessage}`}>
                    No transactions found
                  </div>
                </div>
              )}
              {ownTransactions.length > 10 && (
                <div className={styles.txTableLine}>
                  <div className={`${styles.txTableCell} ${styles.moreTransactionsMessage}`}>
                    +{ownTransactions.length - 10} more transactions
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === "code" && (
            <div className={styles.codeSection}>
              <CodeBlock
                title="Assembly Code"
                content={assembly}
                variant="assembly"
                placeholder="No assembly code available"
              />

              <CodeBlock
                title="Hex"
                content={codeHex}
                variant="hex"
                placeholder="No hex code available"
              />
            </div>
          )}

          {activeTab === "state-init" && (
            <div className={styles.stateSection}>
              {stateInit && (
                <div>
                  <div className={styles.parsedStateInitHeader}>Parsed State Init</div>
                  <div className={styles.parsedStateInit}>{renderStateInit()}</div>
                </div>
              )}

              <CodeBlock
                title="Hex"
                content={stateInitHex}
                variant="hex"
                placeholder="No init data available"
              />

              <CodeBlock
                title="Cells"
                content={stateInitCell}
                variant="hex"
                placeholder="No init data available"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
