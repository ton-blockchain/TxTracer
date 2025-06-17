import {type ABIType, Address, type Cell, type Message, type Slice} from "@ton/core"
import {decompileCell} from "ton-assembly-test-dev/dist/runtime/instr"
import {print} from "ton-assembly-test-dev/dist/text"

import type {Maybe} from "@ton/core/dist/utils/maybe"

import {FaArrowRight} from "react-icons/fa"

import AddressChip from "@shared/ui/AddressChip"
import Badge from "@shared/ui/Badge"

import {formatCurrency} from "@shared/lib/format"

import {bigintToAddress, findOpcodeAbi} from "@app/pages/SandboxPage/common.ts"

import type {ContractData, TestData, TransactionInfo} from "../../../pages/SandboxPage/SandboxPage"

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
  /** Parsed state init data */
  readonly stateInit?: Record<string, ParsedSlice>
}

function findContractWithMatchingCode(contracts: Map<string, ContractData>, code: Cell) {
  if (!code) return undefined
  return [...contracts.values()].find(
    it => it.stateInit?.code?.toBoc()?.toString("hex") === code?.toBoc()?.toString("hex"),
  )
}

// eslint-disable-next-line functional/type-declaration-immutability
type ParsedSlice =
  | number
  | bigint
  | Address
  | Cell
  | Slice
  | null
  | {readonly $: "sub-object"; readonly value: Record<string, ParsedSlice> | undefined}

function showRecordValues(data: Record<string, ParsedSlice>) {
  return (
    <>
      {Object.entries(data).map(([key, value]) => (
        <div key={key}>
          &nbsp;&nbsp;&nbsp;{key.toString()}
          {": "}
          {value instanceof Address ? (
            <AddressChip address={value.toString()} />
          ) : value &&
            typeof value === "object" &&
            "$" in value &&
            value.$ === "sub-object" &&
            value.value ? (
            showRecordValues(value.value)
          ) : (
            // eslint-disable-next-line @typescript-eslint/no-base-to-string
            value?.toString()
          )}
        </div>
      ))}
    </>
  )
}

function findTransactions(tests: TestData[], contract: ContractData) {
  return tests.flatMap(it => {
    return it.transactions.filter(transaction => {
      const ownerAddress = bigintToAddress(transaction.transaction.address)
      if (!ownerAddress) return false
      return ownerAddress.toString() === contract.address.toString()
    })
  })
}

interface TxOpcode {
  readonly opcode: number | undefined
  readonly abiType: ABIType | undefined
}

function getTxOpcode(tx: TransactionInfo, contracts: Map<string, ContractData>): TxOpcode {
  let opcode: number | undefined = undefined
  const slice = tx.transaction.inMessage?.body?.asSlice()
  if (slice && slice.remainingBits >= 32) {
    opcode = slice.loadUint(32)
  }

  const abiType = findOpcodeAbi(tx, contracts, opcode)

  return {
    opcode,
    abiType,
  }
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

function inMessageView(inMessage: Maybe<Message>) {
  if (!inMessage) {
    return <span className={styles.addressShort}>—</span>
  }

  if (inMessage.info.type === "internal") {
    const src = inMessage.info.src
    const dest = inMessage.info.dest

    return (
      <div className={styles.inMessage}>
        <span className={styles.addressShort}>{truncateMiddle(src.toString(), 10)}</span>
        <FaArrowRight />
        <span className={styles.addressShort}>{truncateMiddle(dest.toString(), 10)}</span>
      </div>
    )
  }

  return <span className={styles.addressShort}>External</span>
}

function TxTableLine({tx, contracts}: {tx: TransactionInfo; contracts: Map<string, ContractData>}) {
  const opcode = getTxOpcode(tx, contracts)
  const inMessage = tx.transaction.inMessage

  const value = inMessage?.info?.type === "internal" ? inMessage?.info.value?.coins : undefined

  return (
    <div className={styles.txTableLine}>
      <div className={styles.txTableCellOpcode}>
        {opcode.abiType?.name ?? (opcode.opcode ? `0x${opcode.opcode.toString(16)}` : "Empty")}
      </div>
      <div className={styles.txTableCell}>{inMessageView(inMessage)}</div>
      <div className={`${styles.txTableCell} ${styles.txTableCellValue}`}>
        {formatCurrency(value)}
      </div>
    </div>
  )
}

function ContractDetails({
  contract,
  contracts,
  tests,
  isDeployed,
  stateInit,
}: ContractDetailsProps) {
  const address = contract.address.toString()
  const balance = formatCurrency(contract.account.account?.storage?.balance?.coins)
  const contractType =
    (contract.meta?.treasurySeed ? "Treasury" : contract.meta?.wrapperName) ?? undefined

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

  const ownTransactions = findTransactions(tests, contract)

  const code = contract?.stateInit?.code
  const contractName =
    contract.meta?.wrapperName ??
    (code ? findContractWithMatchingCode(contracts, code)?.meta?.wrapperName : undefined) ??
    "Unknown Contract"

  const assembly = contract.stateInit?.code ? print(decompileCell(contract.stateInit?.code)) : ""

  const renderStateInit = () => {
    if (!stateInit) return null
    return showRecordValues(stateInit)
  }

  return (
    <div className={styles.container}>
      <div className={styles.mainInformation}>
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
        <div className={styles.txTableHeader}>
          <div className={styles.txTableHeaderCell}>Operation</div>
          <div className={styles.txTableHeaderCell}>Message</div>
          <div className={styles.txTableHeaderCell}>Value</div>
        </div>
        {ownTransactions.length > 0 ? (
          ownTransactions
            .slice(0, 10)
            .map((tx, index) => <TxTableLine key={index} tx={tx} contracts={contracts} />)
        ) : (
          <div className={styles.txTableLine}>
            <div
              className={styles.txTableCell}
              style={{
                gridColumn: "1 / -1",
                textAlign: "center",
                color: "var(--color-text-secondary)",
              }}
            >
              No transactions found
            </div>
          </div>
        )}
        {ownTransactions.length > 10 && (
          <div className={styles.txTableLine}>
            <div
              className={styles.txTableCell}
              style={{
                gridColumn: "1 / -1",
                textAlign: "center",
                color: "var(--color-text-secondary)",
              }}
            >
              +{ownTransactions.length - 10} more transactions
            </div>
          </div>
        )}
      </div>

      <div className={styles.header}>
        <div className={styles.titleRow}>
          <h3 className={styles.title}>{contract.meta?.treasurySeed ? "Treasury" : "Contract"}</h3>
          {isDeployed && <Badge color="green">Deployed</Badge>}
        </div>
        <div className={styles.contractName}>{contract.meta?.treasurySeed ?? contractName}</div>
      </div>

      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>Code Hash</h4>
        <div className={styles.hash}>
          {contract.stateInit?.code?.toBoc()?.toString("hex")?.slice(0, 32)}...
        </div>
      </div>

      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>Init Data Hash</h4>
        <div className={styles.hash}>
          {contract.stateInit?.data?.toBoc()?.toString("hex")?.slice(0, 32)}...
        </div>
      </div>

      {stateInit && (
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>Parsed Init Data</h4>
          <div className={styles.stateInit}>{renderStateInit()}</div>
        </div>
      )}

      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>Assembly Preview</h4>
        <div className={styles.assembly}>
          {assembly.substring(0, 200)}
          {assembly.length > 200 && "..."}
        </div>
      </div>

      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>Transactions</h4>
        <div className={styles.transactions}>
          <div className={styles.transactionCount}>Total: {ownTransactions.length}</div>
          {ownTransactions.slice(0, 5).map((tx, index) => (
            <div key={index} className={styles.transactionItem}>
              <span className={styles.transactionLt}>LT: {tx.transaction.lt}</span>
              <Badge
                color={
                  tx.transaction.description.type === "generic" &&
                  tx.transaction.description.computePhase?.type === "vm" &&
                  tx.transaction.description.computePhase.success
                    ? "green"
                    : "red"
                }
              >
                {tx.transaction.description.type === "generic" &&
                tx.transaction.description.computePhase?.type === "vm" &&
                tx.transaction.description.computePhase.success
                  ? "Success"
                  : "Failed"}
              </Badge>
            </div>
          ))}
          {ownTransactions.length > 5 && (
            <div className={styles.moreTransactions}>
              +{ownTransactions.length - 5} more transactions
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ContractDetails
