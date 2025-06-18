import {Cell, loadTransaction, type Transaction} from "@ton/core"

import type {TransactionInfo} from "@features/sandbox/lib/transaction.ts"

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
  readonly transaction: Transaction
  readonly fields: Record<string, unknown>
  parent: TransactionInfo | undefined
  children: TransactionInfo[]
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

  const result: MutableTransactionInfo = {
    transaction: tx.parsedTransaction ?? loadTransaction(Cell.fromHex(tx.transaction).asSlice()),
    fields: tx.fields,
    parent: undefined,
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
