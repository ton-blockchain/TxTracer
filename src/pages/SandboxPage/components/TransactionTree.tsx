import {useMemo, useState} from "react"
import type {Orientation, RawNodeDatum, TreeLinkDatum} from "react-d3-tree"
import {Tree} from "react-d3-tree"
import {Address, beginCell, type Cell} from "@ton/core"

import {findOpcodeAbi} from "@app/pages/SandboxPage/common.ts"

import {formatCurrency} from "@shared/lib/format"

import type {TestData} from "@features/sandbox/lib/test-data.ts"
import type {TransactionInfo} from "@features/sandbox/lib/transaction.ts"
import type {ContractData} from "@features/sandbox/lib/contract"

import styles from "./TransactionTree.module.css"

interface TooltipData {
  readonly x: number
  readonly y: number
  readonly fromAddress: string
  readonly toAddress: string
  readonly value?: string
  readonly opcode?: string
  readonly success: boolean
  readonly exitCode?: string
}

interface TransactionTreeProps {
  readonly testData: TestData
  readonly contracts: Map<string, ContractData>
}

const bigintToAddress = (addr: bigint | undefined): Address | undefined => {
  if (!addr) return undefined

  try {
    const addr2 = beginCell().storeUint(4, 3).storeUint(0, 8).storeUint(addr, 256).endCell()
    return addr2.asSlice().loadAddress()
  } catch {
    return undefined
  }
}

const formatAddress = (
  address: Address | undefined,
  contracts: Map<string, ContractData>,
): string => {
  if (!address) {
    return "unknown"
  }

  const meta = contracts.get(address.toString())
  if (meta) {
    const code = meta.stateInit?.code
    const name =
      meta.meta?.treasurySeed ??
      meta.meta?.wrapperName ??
      (code ? findContractWithMatchingCode(contracts, code)?.meta?.wrapperName : undefined)
    if (name) {
      return `${name}`
    }
  }

  return address.toString().slice(0, 8) + "..."
}

function findContractWithMatchingCode(contracts: Map<string, ContractData>, code: Cell) {
  return [...contracts.values()].find(
    it => it.stateInit?.code?.toBoc()?.toString("hex") === code?.toBoc()?.toString("hex"),
  )
}

export function TransactionTree({testData, contracts}: TransactionTreeProps) {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null)

  const treeData = useMemo(() => {
    const rootTransactions = testData.transactions.filter(tx => !tx.parent)

    const convertTransactionToNode = (tx: TransactionInfo): RawNodeDatum => {
      const thisAddress = bigintToAddress(tx.transaction.address)
      const addressName = formatAddress(thisAddress, contracts)

      const computePhase =
        tx.transaction.description.type === "generic"
          ? tx.transaction.description.computePhase
          : null

      const inMessage = tx.transaction.inMessage
      const withInitCode = inMessage?.init?.code !== undefined
      const isBounced = inMessage?.info?.type === "internal" ? inMessage.info.bounced : false

      const isSuccess = computePhase?.type === "vm" ? computePhase.success : true
      const exitCode =
        computePhase?.type === "vm"
          ? computePhase.exitCode === 0
            ? tx.transaction.description.type === "generic"
              ? (tx.transaction.description.actionPhase?.resultCode ?? 0)
              : 0
            : computePhase.exitCode
          : undefined

      const value =
        tx.transaction.inMessage?.info?.type === "internal"
          ? tx.transaction.inMessage?.info.value?.coins
          : undefined

      let opcode: number | undefined = undefined
      const slice = tx.transaction.inMessage?.body?.asSlice()
      if (slice && slice.remainingBits >= 32) {
        try {
          if (isBounced) {
            // skip 0xFFFF..
            slice.loadUint(32)
          }
          opcode = slice.loadUint(32)
        } catch {
          // ignore
        }
      }

      const abiType = findOpcodeAbi(tx, contracts, opcode)
      const opcodeName = abiType?.name

      const contractLetter = thisAddress
        ? (contracts.get(thisAddress.toString())?.letter ?? "?")
        : "?"

      const opcodeHex = opcode?.toString(16)
      return {
        name: `${addressName}`,
        attributes: {
          from: tx.transaction.inMessage?.info?.src?.toString() ?? "unknown",
          to: tx.transaction.inMessage?.info?.dest?.toString() ?? "unknown",
          lt: tx.transaction.lt.toString(),
          success: isSuccess ? "✓" : "✗",
          exitCode: exitCode?.toString() ?? "0",
          value: formatCurrency(value),
          opcode: opcodeName ?? (opcodeHex ? `0x${opcodeHex}` : undefined) ?? "empty opcode",
          outMsgs: tx.transaction.outMessagesCount.toString(),
          withInitCode,
          isBounced,
          contractLetter,
        },
        children: tx.children.map(it => convertTransactionToNode(it)),
      }
    }

    if (rootTransactions.length > 0) {
      return {
        name: "",
        attributes: {
          isRoot: "true",
        },
        children: rootTransactions.map(convertTransactionToNode),
      }
    }

    return {
      name: "No transactions",
      attributes: {},
      children: [],
    }
  }, [testData.transactions, contracts])

  const renderCustomNodeElement = ({
    nodeDatum,
    toggleNode,
  }: {
    nodeDatum: RawNodeDatum
    toggleNode: () => void
  }) => {
    if (nodeDatum.attributes?.isRoot === "true") {
      return (
        <g>
          <circle
            r={20}
            fill={"var(--color-background-primary)"}
            stroke="var(--color-text-primary)"
            strokeWidth={2}
          />
          <text
            fill="var(--color-text-primary)"
            strokeWidth="0"
            x="0"
            y="5"
            fontSize="14"
            fontWeight="bold"
            textAnchor="middle"
          >
            BL
          </text>
        </g>
      )
    }

    // [x] убрать lt
    // [x] убрать out
    // [x] show bounced with пунктирная
    // [ ] при наведении на вершинку показывать gas or value in TON
    // [ ] при наведенении на ребро показывать forward fee
    // [ ] при наведении на exit code показывать тактовскую строку
    // [x] показывать success если exit code != 0
    // [ ] превращать (в отдельной вью) дерево в граф для каждой горизонтальной ...
    // [ ] send mode 128 + 32 - уничтожает контракт после того как отравит сообщение и баланс равен 0
    // [ ] printTransactionFees
    // [ ] Transaction fees

    const opcode = (nodeDatum.attributes?.opcode as string | undefined) ?? "empty opcode"
    const isNumberOpcode = !Number.isNaN(Number.parseInt(opcode))

    return (
      <g>
        <foreignObject
          width="4"
          height="6"
          x="-25"
          y="-3"
          style={{
            pointerEvents: "none",
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <svg
            width="4"
            height="6"
            viewBox="0 0 4 5"
            xmlns="http://www.w3.org/2000/svg"
            style={{display: "block", stroke: "none"}}
          >
            <path
              d="M0.400044 0.549983C0.648572 0.218612 1.11867 0.151455 1.45004 0.399983L3.45004 1.89998C3.6389 2.04162 3.75004 2.26392 3.75004 2.49998C3.75004 2.73605 3.6389 2.95834 3.45004 3.09998L1.45004 4.59998C1.11867 4.84851 0.648572 4.78135 0.400044 4.44998C0.151516 4.11861 0.218673 3.64851 0.550044 3.39998L1.75004 2.49998L0.550044 1.59998C0.218673 1.35145 0.151516 0.881354 0.400044 0.549983Z"
              fill="var(--foregroundTertiary)"
            ></path>
          </svg>
        </foreignObject>
        <circle
          r={20}
          fill={
            nodeDatum.attributes?.success === "✓" ? "var(--color-background-primary)" : "#ef4444"
          }
          stroke="var(--color-text-primary)"
          strokeWidth={2}
          onClick={toggleNode}
        />

        <text
          fill="var(--color-text-primary)"
          strokeWidth="0"
          x="0"
          y="5"
          fontSize="14"
          fontWeight="bold"
          textAnchor="middle"
        >
          {nodeDatum.attributes?.contractLetter}
        </text>
        <foreignObject width="200" height="100" x="-230" y="-37">
          <div
            className={styles.edgeText}
            onMouseEnter={event => {
              const attributes = nodeDatum.attributes
              if (!attributes) return

              const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()

              setTooltip({
                x: rect.left + rect.width / 2,
                y: rect.top,
                fromAddress: attributes.from as string,
                toAddress: attributes.to as string,
                value: attributes.value as string,
                opcode: attributes.opcode as string,
                success: attributes.success === "✓",
                exitCode: attributes.exitCode as string,
              })
            }}
            onMouseLeave={() => {
              console.log("leave")
              setTooltip(null)
            }}
          >
            <div className={styles.topText}>
              <p className={styles.edgeTextTitle}>{nodeDatum.name}</p>
              {nodeDatum.attributes?.value && (
                <p className={styles.edgeTextContent}>{nodeDatum.attributes.value}</p>
              )}
            </div>
            <div className={styles.bottonText}>
              <p className={styles.edgeTextContent}>
                {!isNumberOpcode ? opcode : <>Opcode: {opcode}</>}
              </p>
              {nodeDatum.attributes?.exitCode && nodeDatum.attributes?.exitCode !== "0" && (
                <p className={styles.edgeTextContent}>
                  Exit: {nodeDatum.attributes?.exitCode} | Success:{" "}
                  {nodeDatum.attributes?.success === "✓" ? "true" : "false"}
                </p>
              )}
            </div>
          </div>
        </foreignObject>
      </g>
    )
  }

  const getDynamicPathClass = ({target}: TreeLinkDatum, _orientation: Orientation): string => {
    const attributes = target.data.attributes
    if (attributes && attributes?.withInitCode) {
      return styles.edgeStyle + ` ${styles.edgeStyleWithInit}`
    }
    if (attributes && attributes?.isBounced) {
      return styles.edgeStyle + ` ${styles.edgeStyleBounced}`
    }

    return styles.edgeStyle
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <p className={styles.stats}>
          Total transactions: {testData.transactions.length}
          {testData.transactions.filter(tx => !tx.parent).length > 1 &&
            ` (${testData.transactions.filter(tx => !tx.parent).length} root transactions)`}
          {` | Contracts: ${contracts.size}`}
        </p>
      </div>

      <div className={styles.treeContainer}>
        <div className={styles.treeWrapper}>
          <Tree
            // @ts-expect-error todo
            data={treeData}
            orientation="horizontal"
            pathFunc={e => {
              const t = e.target.data.attributes ?? {}
              return t.isFirst
                ? "M"
                    .concat(e.source.y.toString(), ",")
                    .concat(e.source.x.toString(), "V")
                    .concat((e.target.x + 10).toString(), "a10 10 0 0 1 10 -10H")
                    .concat((e.target.y - 18).toString())
                : t.isLast
                  ? "M"
                      .concat(e.source.y.toString(), ",")
                      .concat(e.source.x.toString(), "V")
                      .concat((e.target.x - 10).toString(), "a10 10 0 0 0 10 10H")
                      .concat((e.target.y - 18).toString())
                  : "M"
                      .concat(e.source.y.toString(), ",")
                      .concat(e.source.x.toString(), "V")
                      .concat(e.target.x.toString(), "H")
                      .concat((e.target.y - 18).toString())
            }}
            nodeSize={{x: 200, y: 120}}
            separation={{siblings: 0.8, nonSiblings: 1}}
            renderCustomNodeElement={renderCustomNodeElement}
            pathClassFunc={getDynamicPathClass}
            translate={{x: 50, y: 300}}
            zoom={1}
            enableLegacyTransitions={true}
            collapsible={false}
          />
          {tooltip && (
            <div
              style={{
                position: "fixed",
                left: Math.max(10, Math.min(tooltip.x - 50, window.innerWidth - 220)),
                top: Math.max(10, tooltip.y - 160),
                width: "200px",
                height: "auto",
                zIndex: 1000,
                pointerEvents: "none",
              }}
            >
              <div className={styles.tooltip}>
                <div className={styles.tooltipContent}>
                  <p className={styles.tooltipText}>From: {tooltip.fromAddress}</p>
                  <p className={styles.tooltipText}>To: {tooltip.toAddress}</p>
                  {tooltip.value && <p className={styles.tooltipText}>Value: {tooltip.value}</p>}
                  {tooltip.opcode && <p className={styles.tooltipText}>Opcode: {tooltip.opcode}</p>}
                  <p className={styles.tooltipText}>Success: {tooltip.success ? "✓" : "✗"}</p>
                  {tooltip.exitCode && tooltip.exitCode !== "0" && (
                    <p className={styles.tooltipText}>Exit Code: {tooltip.exitCode}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
