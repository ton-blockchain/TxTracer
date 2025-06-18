import type {Address, Transaction} from "@ton/core"

import type {ContractData} from "@features/sandbox/lib/contract.ts"

/**
 * Processed transaction info with all necessary transport.
 */
export interface TransactionInfo {
  readonly address: Address | undefined
  readonly transaction: Transaction
  readonly fields: Record<string, unknown>
  readonly opcode: number | undefined
  readonly data: TransactionInfoData
  readonly parent: TransactionInfo | undefined
  readonly children: readonly TransactionInfo[]
}

export type TransactionInfoData = InternalTransactionInfoData | ExternalTransactionInfoData

export interface InternalTransactionInfoData {
  readonly dummy?: number
}

export interface ExternalTransactionInfoData {
  readonly dummy?: number
}

/**
 * Search for ABI type for given opcode
 */
export function findOpcodeABI(tx: TransactionInfo, contracts: Map<string, ContractData>) {
  if (tx.opcode === undefined) return undefined

  const txAddress = tx?.address
  if (!txAddress) return undefined

  const contract = contracts.get(txAddress.toString())
  if (contract?.meta?.abi) {
    // first search in abi of tx contract
    const found = contract?.meta?.abi.types?.find(it => it.header === tx.opcode)
    if (found) return found
  }

  for (const contract of [...contracts.values()]) {
    // but if we send a message from another contract, we may need to search everywhere
    const found = contract?.meta?.abi?.types?.find(it => it.header === tx.opcode)
    if (found) return found
  }
  return undefined
}
