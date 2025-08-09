import type {ContractMeta} from "@ton/sandbox/dist/meta/ContractsMeta"

export interface ContractRawData {
  readonly address: string
  readonly meta: ContractMeta | undefined
  readonly stateInit: string | undefined
  readonly account: string
}

export type ContractStateChange = {
  readonly address: string | undefined
  readonly lt: string
  readonly before: string | undefined
  readonly after: string | undefined
}
