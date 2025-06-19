import type {ContractRawData} from "@features/sandbox/lib/transport/contract.ts"

export type MessageTestData = {
  readonly $: "test-data"
  readonly testName: string | undefined
  readonly transactions: string
  readonly contracts: readonly ContractRawData[]
}

export type Message = MessageTestData
