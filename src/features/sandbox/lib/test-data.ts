import type {TransactionInfo} from "@features/sandbox/lib/transaction.ts"
import type {ContractData} from "@features/sandbox/lib/contract.ts"

/**
 * Represent single test from sandbox
 */
export type TestData = {
  readonly id: number
  readonly testName: string | undefined
  readonly transactions: TransactionInfo[]
  readonly timestamp?: number
  readonly contracts: Map<string, ContractData>
}
