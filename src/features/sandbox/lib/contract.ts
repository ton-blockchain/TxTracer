import {Address, type ShardAccount, type StateInit} from "@ton/core"
import type {ContractMeta} from "@ton/sandbox/dist/meta/ContractsMeta"

export type ContractData = {
  readonly address: Address
  readonly meta: ContractMeta | undefined
  readonly stateInit: StateInit | undefined
  readonly account: ShardAccount
}

export type ContractLetter = {
  readonly letter: string
  readonly address: string
  readonly name: string
}
