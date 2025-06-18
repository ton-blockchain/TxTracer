import type {Transaction} from "@ton/core"

/**
 * Processed transaction info with all necessary data.
 */
export type TransactionInfo = {
  readonly transaction: Transaction
  readonly fields: Record<string, unknown>
  readonly parent: TransactionInfo | undefined
  readonly children: readonly TransactionInfo[]
}
