import type {ContractRawData} from "@features/sandbox/lib/transport/contract.ts"

export type MessageTransactions = {
  readonly $: "txs"
  readonly testName: string | undefined
  readonly data: string
}

export type MessageNextTest = {
  readonly $: "next-test"
}

export type MessageContracts = {
  readonly $: "known-contracts"
  readonly data: readonly ContractRawData[]
}

export type Message = MessageNextTest | MessageTransactions | MessageContracts
