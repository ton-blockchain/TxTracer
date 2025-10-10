import type {
  ContractRawData,
  ContractStateChange,
} from "@features/sandbox/lib/transport/contract.ts"

export type ValueFlow = {
  readonly before: bigint
  readonly after: bigint
}

export type MessageTestData = {
  readonly $: "test-data"
  readonly testName: string | undefined
  readonly transactions: string
  readonly contracts: readonly ContractRawData[]
  readonly changes: readonly ContractStateChange[]
  readonly valueFlow: Map<string, ValueFlow>
}

export type Message = MessageTestData
