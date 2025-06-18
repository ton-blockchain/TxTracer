import type {TransactionInfo} from "@features/sandbox/lib/transaction.ts"

/**
 * Represent single test from sandbox
 */
export type TestData = {
  readonly id: number
  readonly testName: string | undefined
  readonly transactions: TransactionInfo[]
  readonly timestamp?: number
}
