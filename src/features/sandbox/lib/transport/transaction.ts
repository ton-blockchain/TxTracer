import {Address, Cell, loadTransaction, type Transaction} from "@ton/core"

import {
  type ExternalTransactionInfoData,
  type InternalTransactionInfoData,
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

  const result: MutableTransactionInfo = {
    address,
    transaction: parsedTx,
    fields: tx.fields,
    parent: undefined,
    opcode: txOpcode(parsedTx),
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
 * Convert raw transactions from sandbox to an object tree
 * @param txs
 */
export const processRawTransactions = (txs: RawTransactionInfo[]): TransactionInfo[] => {
  return txs.map(tx => processRawTx(tx, txs, new Map()))
}
