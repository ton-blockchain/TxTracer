import type {TransactionInfo} from "@features/sandbox/lib/transaction.ts"
import type {ContractData} from "@features/sandbox/lib/contract.ts"
import type {ContractStateChange} from "@features/sandbox/lib/transport/contract.ts"
import type {ValueFlow} from "@features/sandbox/lib/transport/message.ts"

/**
 * Represent single test from sandbox
 */
export interface TestData {
  readonly testName: string
  readonly transactions: TransactionInfo[]
  readonly timestamp?: number
  readonly contracts: Map<string, ContractData>
  readonly changes: readonly ContractStateChange[]
  readonly valueFlow?: Map<string, ValueFlow>
}
