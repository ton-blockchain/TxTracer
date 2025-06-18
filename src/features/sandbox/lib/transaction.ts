import type {Transaction} from "@ton/core"

/**
 * Processed transaction info with all necessary transport.
 */
export type TransactionInfo = {
  readonly transaction: Transaction
  readonly fields: Record<string, unknown>
  readonly parent: TransactionInfo | undefined
  readonly children: readonly TransactionInfo[]
}
