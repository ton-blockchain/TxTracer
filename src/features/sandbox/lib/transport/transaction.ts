import {Address, Cell, loadTransaction, type Transaction} from "@ton/core"

import {
  type ComputeInfo,
  type ExternalTransactionInfoData,
  type InternalTransactionInfoData,
  type TransactionMoney,
  type TransactionInfo,
  type TransactionInfoData,
} from "@features/sandbox/lib/transaction.ts"

/**
 * Bucket of transactions from sandbox
 */
export type RawTransactions = {
  readonly transactions: RawTransactionInfo[]
}

/**
 * Transaction info from sandbox
 */
export type RawTransactionInfo = {
  readonly transaction: string
  readonly parsedTransaction: Transaction | undefined // filled later
  readonly fields: Record<string, unknown>
  readonly parentId: string
  readonly childrenIds: string[]
}

// temp type only for building
// eslint-disable-next-line functional/type-declaration-immutability
interface MutableTransactionInfo {
  readonly address: Address | undefined
  readonly transaction: Transaction
  readonly fields: Record<string, unknown>
  readonly opcode: number | undefined
  readonly computeInfo: ComputeInfo
  readonly money: TransactionMoney
  readonly amount: bigint | undefined
  readonly data: TransactionInfoData
  parent: TransactionInfo | undefined
  children: TransactionInfo[]
}

const bigintToAddress = (addr: bigint | undefined): Address | undefined => {
  try {
    return addr ? Address.parseRaw(`0:${addr.toString(16)}`) : undefined
  } catch {
    return undefined
  }
}

function txOpcode(transaction: Transaction): number | undefined {
  const inMessage = transaction.inMessage
  const isBounced = inMessage?.info?.type === "internal" ? inMessage.info.bounced : false

  let opcode: number | undefined = undefined
  const slice = inMessage?.body?.asSlice()
  if (slice && slice.remainingBits >= 32) {
    if (isBounced) {
      // skip 0xFFFF..
      slice.loadUint(32)
    }
    opcode = slice.loadUint(32)
  }

  return opcode
}

function txData(transaction: Transaction): TransactionInfoData {
  const inMessage = transaction.inMessage
  if (inMessage?.info?.type === "internal") {
    return {} satisfies InternalTransactionInfoData
  }

  return {} satisfies ExternalTransactionInfoData
}

const processRawTx = (
  tx: RawTransactionInfo,
  txs: RawTransactionInfo[],
  visited: Map<RawTransactionInfo, TransactionInfo>,
): TransactionInfo => {
  const cached = visited.get(tx)
  if (cached) {
    return cached
  }

  const parsedTx = tx.parsedTransaction ?? loadTransaction(Cell.fromHex(tx.transaction).asSlice())
  const address = bigintToAddress(parsedTx.address)

  const {computeInfo, amount, money} = computeFinalData(tx)

  const result: MutableTransactionInfo = {
    address,
    transaction: parsedTx,
    fields: tx.fields,
    parent: undefined,
    opcode: txOpcode(parsedTx),
    computeInfo,
    money,
    amount,
    data: txData(parsedTx),
    children: [],
  }
  visited.set(tx, result)

  const parent = txs.find(it => it.parsedTransaction?.lt.toString() === tx.parentId)

  result.parent = parent ? processRawTx(parent, txs, visited) : undefined

  result.children = tx.childrenIds
    .map(child => txs.find(it => it.parsedTransaction?.lt.toString() === child))
    .filter(it => it !== undefined)
    .map(tx => processRawTx(tx, txs, visited))

  return result
}

/**
 * Sum the value (`coins`) of every *internal* outgoing message
 * produced by a transaction. External messages are ignored since its
 * value is always 0.
 *
 * @param tx  Parsed {@link Transaction}.
 * @returns   Total toncoins sent out by the contract in this tx.
 */
const calculateSentTotal = (tx: Transaction): bigint => {
  let total = 0n
  for (const msg of tx.outMessages.values()) {
    if (msg.info.type === "internal") {
      total += msg.info.value.coins
    }
  }
  return total
}

const computeFinalData = (res: RawTransactionInfo) => {
  const emulatedTx = loadTransaction(Cell.fromHex(res.transaction).asSlice())
  if (!emulatedTx.inMessage) {
    throw new Error("No in_message was found in result tx")
  }

  const amount =
    emulatedTx.inMessage.info.type === "internal"
      ? emulatedTx.inMessage.info.value.coins
      : undefined

  const sentTotal = calculateSentTotal(emulatedTx)
  const totalFees = emulatedTx.totalFees.coins

  if (emulatedTx.description.type !== "generic") {
    throw new Error(
      "TxTracer doesn't support non-generic transaction. Given type: " +
        emulatedTx.description.type,
    )
  }

  const computePhase = emulatedTx.description.computePhase
  const computeInfo: ComputeInfo =
    computePhase.type === "skipped"
      ? "skipped"
      : {
          success: computePhase.success,
          exitCode:
            computePhase.exitCode === 0
              ? (emulatedTx.description.actionPhase?.resultCode ?? 0)
              : computePhase.exitCode,
          vmSteps: computePhase.vmSteps,
          gasUsed: computePhase.gasUsed,
          gasFees: computePhase.gasFees,
        }

  const money: TransactionMoney = {
    sentTotal,
    totalFees,
  }

  return {
    money,
    amount,
    computeInfo,
  }
}

/**
 * Convert raw transactions from sandbox to an object tree
 * @param txs
 */
export const processRawTransactions = (txs: RawTransactionInfo[]): TransactionInfo[] => {
  return txs.map(tx => processRawTx(tx, txs, new Map()))
}
