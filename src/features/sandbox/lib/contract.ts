import {Address, type ShardAccount, type StateInit} from "@ton/core"
import type {ContractMeta} from "@ton/sandbox/dist/meta/ContractsMeta"

export type ContractData = {
  readonly address: Address
  readonly meta: ContractMeta | undefined
  readonly stateInit: StateInit | undefined
  readonly account: ShardAccount
  readonly letter: string
  readonly displayName: string
}
