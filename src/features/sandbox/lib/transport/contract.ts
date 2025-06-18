import type {ContractMeta} from "@ton/sandbox/dist/meta/ContractsMeta"

export interface ContractRawData {
  readonly address: string
  readonly meta: ContractMeta | undefined
  readonly stateInit: string | undefined
  readonly account: string
}
