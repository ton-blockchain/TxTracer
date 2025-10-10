import React, {useMemo, useState, useRef} from "react"
import type {Orientation, RawNodeDatum, TreeLinkDatum} from "react-d3-tree"
import {Tree} from "react-d3-tree"
import {Address, Cell, type ContractABI} from "@ton/core"

import {parseWithPayloads} from "@truecarry/tlb-abi"

import {formatCurrency} from "@shared/lib/format"

import type {TestData} from "@features/sandbox/lib/test-data.ts"
import {findOpcodeABI, type TransactionInfo} from "@features/sandbox/lib/transaction.ts"
import type {ContractData} from "@features/sandbox/lib/contract"
import {parseSliceWithAbiType, type ParsedObjectByABI} from "@features/sandbox/lib/abi/parser.ts"
import {TransactionShortInfo, ContractDetails} from "@app/pages/SandboxPage/components"
import {ParsedDataView} from "@features/sandbox/ui/abi"

import {useTooltip} from "./useTooltip"
import {SmartTooltip} from "./SmartTooltip"

import styles from "./TransactionTree.module.css"

interface TransactionTooltipData {
  readonly fromAddress: string
  readonly computePhase: {
    readonly success: boolean
    readonly exitCode?: number
    readonly gasUsed?: bigint
    readonly vmSteps?: number
  }
  readonly fees: {
    readonly gasFees?: bigint
    readonly totalFees: bigint
  }
  readonly sentTotal: bigint
}

interface NodeTooltipData {
  readonly contractState?: ParsedObjectByABI
  readonly contractStateBefore?: ParsedObjectByABI
  readonly contractData: ContractData
}

interface TransactionTreeProps {
  readonly testData: TestData
}

const formatAddress = (
  address: Address | undefined,
  contracts: Map<string, ContractData>,
): string => {
  if (!address) {
    return "unknown"
  }

  const addressStr = address.toString()
  const meta = contracts.get(addressStr)
  if (meta) {
    const name = meta.displayName
    if (name !== "Unknown Contract") {
      return name
    }
  }

  return addressStr.slice(0, 4) + "..." + addressStr.slice(addressStr.length - 4)
}

const formatAddressShort = (address: Address | undefined): string => {
  if (!address) {
    return "unknown"
  }

  const addressStr = address.toString()
  return addressStr.slice(0, 6) + "..." + addressStr.slice(addressStr.length - 6)
}

const findConstructorAbiType = (abi: ContractABI | undefined, name: string) => {
  return abi?.types?.find(it => it.name === `${name}$Data`)
}

const getContractOtherName = (name: string) => {
  switch (name) {
    case "ExtendedShardedJettonWallet":
      return "JettonWalletSharded"
    case "ExtendedShardedJettonMinter":
      return "JettonMinterSharded"
    case "ExtendedJettonWallet":
      return "JettonWallet"
    case "ExtendedJettonMinter":
      return "JettonMinter"
    case "ExtendedLPJettonWallet":
      return "LPJettonWallet"
    case "ExtendedLPJettonMinter":
      return "LPJettonMinter"
  }
  return name
}

const getContractState = (contract: ContractData, contracts: Map<string, ContractData>) => {
  if (!contract.meta?.abi) {
    if (contract.kind === "treasury") {
      return undefined
    }

    for (const [, otherContract] of contracts) {
      if (!otherContract.meta?.abi) {
        continue
      }

      const state = getContractStateStep(contract, otherContract.meta?.abi)
      if (state) {
        return state
      }
    }
    return undefined
  }

  return getContractStateStep(contract, contract.meta?.abi)
}

const getContractStateStep = (contract: ContractData, contractAbi: ContractABI) => {
  if (contract.kind === "treasury") {
    return undefined
  }

  const initData = contract.stateInit?.data
  if (initData) {
    const copy = Cell.fromHex(initData.toBoc().toString("hex"))

    const abi = findConstructorAbiType(contractAbi, contract.displayName)
    if (abi) {
      return parseSliceWithAbiType(copy.asSlice(), abi, contractAbi.types ?? [])
    }

    const otherName = getContractOtherName(contract.displayName)
    const abi2 = findConstructorAbiType(contractAbi, otherName)
    if (abi2) {
      return parseSliceWithAbiType(copy.asSlice(), abi2, contractAbi.types ?? [])
    }
  }
  return undefined
}

const getContractStateFromString = (stateString: string | null, contract: ContractData) => {
  if (!stateString || contract.kind === "treasury") {
    return undefined
  }

  try {
    const cell = Cell.fromHex(stateString)
    const abi = findConstructorAbiType(contract.meta?.abi ?? undefined, contract.displayName)
    if (abi) {
      return parseSliceWithAbiType(cell.asSlice(), abi, contract.meta?.abi?.types ?? [])
    }

    const otherName = getContractOtherName(contract.displayName)
    const abi2 = findConstructorAbiType(contract.meta?.abi ?? undefined, otherName)
    if (abi2) {
      return parseSliceWithAbiType(cell.asSlice(), abi2, contract.meta?.abi?.types ?? [])
    }
  } catch (error) {
    console.error("Error parsing contract state from string:", error)
  }

  return undefined
}

function TransactionTooltipContent({data}: {data: TransactionTooltipData}) {
  return (
    <div className={styles.tooltipContent}>
      <div className={styles.tooltipField}>
        <div className={styles.tooltipFieldLabel}>From Address</div>
        <div className={styles.tooltipFieldValue}>{data.fromAddress}</div>
      </div>

      <div className={styles.tooltipField}>
        <div className={styles.tooltipFieldLabel}>Compute Phase</div>
        <div className={styles.tooltipFieldValue}>
          {data.computePhase.success ? "Success" : "Failed"}
          {data.computePhase.exitCode !== undefined && data.computePhase.exitCode !== 0 && (
            <span>
              {" "}
              {"(Exit:"} {data.computePhase.exitCode})
            </span>
          )}
          {data.computePhase.gasUsed && (
            <div className={styles.tooltipSubValue}>
              Gas Used: {data.computePhase.gasUsed.toString()}
            </div>
          )}
          {data.computePhase.vmSteps !== undefined && (
            <div className={styles.tooltipSubValue}>
              VM Steps: {data.computePhase.vmSteps.toString()}
            </div>
          )}
        </div>
      </div>

      <div className={styles.tooltipField}>
        <div className={styles.tooltipFieldLabel}>Money</div>
        <div className={styles.tooltipFieldValue}>
          <div>Sent Total: {formatCurrency(data.sentTotal)}</div>
          <div className={styles.tooltipSubValue}>
            Total Fees: {formatCurrency(data.fees.totalFees)}
          </div>
          {data.fees.gasFees && (
            <div className={styles.tooltipSubValue}>
              Gas Fees: {formatCurrency(data.fees.gasFees)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function NodeTooltipContent({
  data,
  contracts,
}: {
  data: NodeTooltipData
  contracts: Map<string, ContractData>
}) {
  return (
    <div className={styles.tooltipContent}>
      <div className={styles.tooltipField}>
        <div className={styles.tooltipFieldLabel}>Contract State</div>
        <div className={styles.tooltipFieldValue}>
          <div className={styles.contractStateData}>
            {data.contractState && (
              <ParsedDataView
                data={data.contractState}
                dataBefore={data.contractStateBefore}
                contracts={contracts}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export function TransactionTree({testData}: TransactionTreeProps) {
  const {
    tooltip,
    showTooltip,
    hideTooltip,
    forceHideTooltip,
    setIsTooltipHovered,
    calculateOptimalPosition,
  } = useTooltip()

  const [selectedTransaction, setSelectedTransaction] = useState<TransactionInfo | null>(null)
  const [selectedContract, setSelectedContract] = useState<ContractData | null>(null)
  const [selectedRootLt, setSelectedRootLt] = useState<string | null>(null)
  const triggerRectRef = useRef<DOMRect | null>(null)

  const contracts = testData.contracts

  const rootTransactions = useMemo(() => {
    return testData.transactions
      .filter(tx => !tx.parent)
      .sort((a, b) => Number(a.transaction.lt - b.transaction.lt))
  }, [testData.transactions])

  const getSubtreeTransactions = (rootTx: TransactionInfo): TransactionInfo[] => {
    const result: TransactionInfo[] = [rootTx]

    const addChildren = (tx: TransactionInfo) => {
      tx.children.forEach(child => {
        result.push(child)
        addChildren(child)
      })
    }

    addChildren(rootTx)
    return result
  }

  const filteredTransactions = useMemo(() => {
    if (!selectedRootLt) {
      return testData.transactions
    }

    const selectedRoot = rootTransactions.find(
      tx => tx.transaction.lt.toString() === selectedRootLt,
    )
    if (!selectedRoot) {
      return testData.transactions
    }

    return getSubtreeTransactions(selectedRoot)
  }, [testData.transactions, selectedRootLt, rootTransactions])

  const handleRootChange = (rootLt: string | null) => {
    setSelectedRootLt(rootLt)
    setSelectedTransaction(null)
    setSelectedContract(null)
  }

  const calculateTreeDimensions = (data: RawNodeDatum): {height: number; width: number} => {
    const getDepth = (node: RawNodeDatum, currentDepth = 0): number => {
      if (!node.children || node.children.length === 0) {
        return currentDepth
      }
      return Math.max(...node.children.map(child => getDepth(child, currentDepth + 1)))
    }

    const countNodes = (node: RawNodeDatum): number => {
      if (!node.children || node.children.length === 0) {
        return 1
      }
      return node.children.reduce((sum: number, child) => sum + countNodes(child), 0)
    }

    const totalNodes = countNodes(data)
    const depth = getDepth(data)

    const height = totalNodes <= 2 ? totalNodes * 80 + 20 : totalNodes * 100 + 100

    return {
      height: Math.max(100, height),
      width: Math.max(800, depth * 200 + 200),
    }
  }

  const transactionMap = useMemo(() => {
    const map = new Map<string, TransactionInfo>()
    for (let i = 0; i < filteredTransactions.length; i++) {
      const tx = filteredTransactions[i]
      map.set(tx.transaction.lt.toString(), tx)
    }
    return map
  }, [filteredTransactions])

  const handleNodeClick = (lt: string) => {
    const transaction = transactionMap.get(lt)
    if (!transaction) return

    if (selectedTransaction?.transaction.lt.toString() === lt) {
      setSelectedTransaction(null)
      setSelectedContract(null)
    } else {
      setSelectedTransaction(transaction)
      setSelectedContract(null)
      if (window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent("resetTraceViewer"))
      }
    }
  }

  const handleContractClick = (contractAddress: string) => {
    const contract = contracts.get(contractAddress)
    if (!contract) return

    if (selectedContract?.address.toString() === contractAddress) {
      setSelectedContract(null)
    } else {
      setSelectedContract(contract)
    }
  }

  const showTransactionTooltip = (event: React.MouseEvent, tx: TransactionInfo) => {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
    triggerRectRef.current = rect

    const computeInfo = tx.computeInfo
    const computePhase = {
      success: computeInfo !== "skipped" ? computeInfo.success : true,
      exitCode: computeInfo !== "skipped" ? computeInfo.exitCode : undefined,
      gasUsed: computeInfo !== "skipped" ? computeInfo.gasUsed : undefined,
      vmSteps: computeInfo !== "skipped" ? computeInfo.vmSteps : undefined,
    }

    const fees = {
      gasFees: computeInfo !== "skipped" ? computeInfo.gasFees : undefined,
      totalFees: tx.money.totalFees,
    }

    const srcAddress = tx.transaction.inMessage?.info?.src
    const fromAddressStr = srcAddress ? formatAddressShort(srcAddress as Address) : "unknown"

    const tooltipData: TransactionTooltipData = {
      fromAddress: fromAddressStr,
      computePhase,
      fees,
      sentTotal: tx.money.sentTotal,
    }

    showTooltip({
      x: rect.left,
      y: rect.top,
      content: <TransactionTooltipContent data={tooltipData} />,
    })
  }

  const showNodeTooltip = (event: React.MouseEvent, tx: TransactionInfo) => {
    if (!tx?.address) return

    const rect = (event.currentTarget as SVGElement).getBoundingClientRect()
    triggerRectRef.current = rect

    const contract = contracts.get(tx.address.toString())
    if (!contract) return

    const contractState = getContractState(contract, contracts)

    const contractChange = testData.changes.find(
      change =>
        change.address === contract.address.toString() &&
        tx.transaction.lt.toString() === change.lt,
    )

    const contractStateBefore = contractChange?.before
      ? getContractStateFromString(contractChange.before, contract)
      : undefined

    const contractStateAfter = contractChange?.after
      ? getContractStateFromString(contractChange.after, contract)
      : contractState

    if (contractStateAfter || contractStateBefore) {
      const nodeTooltipData: NodeTooltipData = {
        contractState: contractStateAfter,
        contractStateBefore,
        contractData: contract,
      }

      showTooltip({
        x: rect.left,
        y: rect.top,
        content: <NodeTooltipContent data={nodeTooltipData} contracts={contracts} />,
      })
    }
  }

  const treeData: RawNodeDatum = useMemo(() => {
    const displayedRoots = selectedRootLt
      ? rootTransactions.filter(tx => tx.transaction.lt.toString() === selectedRootLt)
      : rootTransactions

    const convertTransactionToNode = (tx: TransactionInfo): RawNodeDatum => {
      const thisAddress = tx.address
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

      const opcodeNameFromInMessageBySchemas = () => {
        if (!tx.transaction.inMessage) {
          return undefined
        }
        const parsed = parseWithPayloads(tx.transaction.inMessage.body.asSlice())
        return parsed?.data.kind
      }

      const opcode = tx.opcode
      const opcodeHex = opcode?.toString(16)
      const abiType = findOpcodeABI(tx, contracts)
      const opcodeName = abiType?.name ?? opcodeNameFromInMessageBySchemas()

      const contractLetter = thisAddress
        ? (contracts.get(thisAddress.toString())?.letter ?? "?")
        : "?"

      const lt = tx.transaction.lt.toString()
      const isSelected = selectedTransaction?.transaction.lt.toString() === lt

      const hasExternalOut = Array.from(tx.transaction.outMessages.values()).some(outMsg => {
        return outMsg.info.type === "external-out"
      })

      const externalOutChildren = hasExternalOut
        ? [
            {
              name: "",
              attributes: {
                isExternalOut: true,
                parentLt: lt,
              },
              children: [],
            },
          ]
        : []

      return {
        name: `${addressName}`,
        attributes: {
          from: tx.transaction.inMessage?.info?.src?.toString() ?? "unknown",
          to: tx.transaction.inMessage?.info?.dest?.toString() ?? "unknown",
          lt,
          success: isSuccess ? "✓" : "✗",
          exitCode: exitCode?.toString() ?? "0",
          value: formatCurrency(value),
          opcode: opcodeName ?? (opcodeHex ? `0x${opcodeHex}` : undefined) ?? "empty opcode",
          outMsgs: tx.transaction.outMessagesCount.toString(),
          withInitCode,
          isBounced,
          contractLetter,
          isSelected,
        },
        children: [...tx.children.map(it => convertTransactionToNode(it)), ...externalOutChildren],
      }
    }

    if (displayedRoots.length > 0) {
      return {
        name: "",
        attributes: {
          isRoot: "true",
        },
        children: displayedRoots.map(it => convertTransactionToNode(it)),
      }
    }

    return {
      name: "No transactions",
      attributes: {
        isRoot: false,
      },
      children: [],
    }
  }, [rootTransactions, contracts, selectedTransaction, selectedRootLt])

  const renderCustomNodeElement = ({
    nodeDatum,
    toggleNode: _toggleNode,
  }: {
    nodeDatum: RawNodeDatum
    toggleNode: () => void
  }) => {
    if (nodeDatum.attributes?.isRoot === "true") {
      return (
        <g>
          <circle
            r={15}
            fill={"var(--color-background-secondary)"}
            stroke="var(--color-text-primary)"
            strokeWidth={1.5}
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

    if (nodeDatum.attributes?.isExternalOut) {
      const parentLt = nodeDatum.attributes.parentLt as string
      const parentTx = transactionMap.get(parentLt)

      const externalOutMsg = [...(parentTx?.transaction.outMessages.values() ?? [])].find(
        msg => msg.info.type === "external-out",
      )
      const externalOutDest = externalOutMsg?.info.dest?.toString() ?? "External"
      const createdLt =
        externalOutMsg?.info.type === "external-out" ? externalOutMsg.info.createdLt.toString() : ""

      return (
        <g>
          <foreignObject
            width="4"
            height="6"
            x="-20"
            y="-3"
            className={styles.foreignObjectContainer}
          >
            <svg
              width="4"
              height="6"
              viewBox="0 0 4 5"
              xmlns="http://www.w3.org/2000/svg"
              className={styles.iconSvg}
            >
              <path
                d="M0.400044 0.549983C0.648572 0.218612 1.11867 0.151455 1.45004 0.399983L3.45004 1.89998C3.6389 2.04162 3.75004 2.26392 3.75004 2.49998C3.75004 2.73605 3.6389 2.95834 3.45004 3.09998L1.45004 4.59998C1.11867 4.84851 0.648572 4.78135 0.400044 4.44998C0.151516 4.11861 0.218673 3.64851 0.550044 3.39998L1.75004 2.49998L0.550044 1.59998C0.218673 1.35145 0.151516 0.881354 0.400044 0.549983Z"
                fill="var(--color-text-tertiary)"
              ></path>
            </svg>
          </foreignObject>

          <circle
            r={15}
            fill="transparent"
            stroke="var(--color-border)"
            strokeWidth={1}
            className={styles.nodeCircleDefault}
          />

          <foreignObject width="150" height="100" x="-180" y="-40">
            <div className={styles.edgeText}>
              <div className={styles.topText}>
                <p className={styles.edgeTextTitle}>{externalOutDest}</p>
                <p className={styles.edgeTextContent}>Lt: {createdLt}</p>
              </div>
              <div className={styles.bottonText}>
                <p className={styles.edgeTextContent}>Type: external-out</p>
              </div>
            </div>
          </foreignObject>
        </g>
      )
    }

    const opcode = (nodeDatum.attributes?.opcode as string | undefined) ?? "empty opcode"
    const isNumberOpcode = !Number.isNaN(Number.parseInt(opcode))
    const isSelected = nodeDatum.attributes?.isSelected as boolean
    const lt = nodeDatum.attributes?.lt as string
    const tx = transactionMap.get(lt)

    return (
      <g>
        <foreignObject
          width="4"
          height="6"
          x="-20"
          y="-3"
          className={styles.foreignObjectContainer}
        >
          <svg
            width="4"
            height="6"
            viewBox="0 0 4 5"
            xmlns="http://www.w3.org/2000/svg"
            className={styles.iconSvg}
          >
            <path
              d="M0.400044 0.549983C0.648572 0.218612 1.11867 0.151455 1.45004 0.399983L3.45004 1.89998C3.6389 2.04162 3.75004 2.26392 3.75004 2.49998C3.75004 2.73605 3.6389 2.95834 3.45004 3.09998L1.45004 4.59998C1.11867 4.84851 0.648572 4.78135 0.400044 4.44998C0.151516 4.11861 0.218673 3.64851 0.550044 3.39998L1.75004 2.49998L0.550044 1.59998C0.218673 1.35145 0.151516 0.881354 0.400044 0.549983Z"
              fill="var(--color-text-tertiary)"
            ></path>
          </svg>
        </foreignObject>
        <circle
          r={15}
          fill={
            isSelected
              ? "var(--color-text-primary)"
              : nodeDatum.attributes?.success === "✓"
                ? "var(--color-background-secondary)"
                : "#ef4444"
          }
          stroke={"var(--color-text-primary)"}
          strokeWidth={1.5}
          onClick={() => handleNodeClick(lt)}
          onMouseEnter={event => {
            if (!tx?.address) return
            showNodeTooltip(event, tx)
          }}
          onMouseLeave={() => {
            hideTooltip()
          }}
          style={{cursor: "pointer"}}
        />

        <text
          fill={isSelected ? "var(--color-background-primary)" : "var(--color-text-primary)"}
          strokeWidth="0"
          x="0"
          y="5"
          fontSize="14"
          fontWeight="bold"
          textAnchor="middle"
          style={{pointerEvents: "none"}}
        >
          {nodeDatum.attributes?.contractLetter}
        </text>
        <foreignObject width="150" height="100" x="-180" y="-40">
          <div
            className={styles.edgeText}
            onMouseEnter={event => {
              if (!tx) return
              showTransactionTooltip(event, tx)
            }}
            onMouseLeave={() => {
              hideTooltip()
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

  const treeDimensions = calculateTreeDimensions(treeData)

  return (
    <div className={styles.container}>
      {rootTransactions.length > 1 && (
        <div className={styles.tabsContainer}>
          <button
            className={`${styles.tab} ${!selectedRootLt ? styles.tabActive : ""}`}
            onClick={() => handleRootChange(null)}
          >
            All
          </button>
          {rootTransactions.map((rootTx, index) => {
            const addressName = formatAddress(rootTx.address, contracts)
            const isActive = selectedRootLt === rootTx.transaction.lt.toString()
            return (
              <button
                key={rootTx.transaction.lt.toString()}
                className={`${styles.tab} ${isActive ? styles.tabActive : ""}`}
                onClick={() => handleRootChange(rootTx.transaction.lt.toString())}
              >
                #{index + 1}: {addressName}
              </button>
            )
          })}
        </div>
      )}
      <div className={styles.treeContainer} style={{height: `${treeDimensions.height}px`}}>
        <div className={styles.treeWrapper} style={{width: `${treeDimensions.width}px`}}>
          <Tree
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
            separation={{siblings: 0.7, nonSiblings: 1}}
            renderCustomNodeElement={renderCustomNodeElement}
            pathClassFunc={getDynamicPathClass}
            translate={{x: 50, y: treeDimensions.height / 2}}
            zoom={1}
            enableLegacyTransitions={false}
            collapsible={false}
            zoomable={false}
            draggable={false}
            scaleExtent={{min: 1, max: 1}}
          />
          {tooltip && triggerRectRef.current && (
            <SmartTooltip
              content={tooltip.content}
              triggerRect={triggerRectRef.current}
              onMouseEnter={() => setIsTooltipHovered(true)}
              onMouseLeave={() => setIsTooltipHovered(false)}
              onForceHide={forceHideTooltip}
              calculateOptimalPosition={calculateOptimalPosition}
            />
          )}
        </div>
      </div>

      {selectedTransaction && (
        <div className={styles.transactionDetails}>
          <TransactionShortInfo
            tx={selectedTransaction}
            testData={testData}
            contracts={contracts}
            onContractClick={handleContractClick}
          />
        </div>
      )}

      {selectedContract && (
        <div className={styles.contractDetails}>
          <ContractDetails
            contract={selectedContract}
            contracts={contracts}
            tests={[testData]}
            isDeployed={true}
          />
        </div>
      )}
    </div>
  )
}
