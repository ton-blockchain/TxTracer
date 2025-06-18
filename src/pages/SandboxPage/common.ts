import {type ABIType, Address, Cell, type Slice} from "@ton/core"

import type {TransactionInfo} from "@features/sandbox/lib/transaction.ts"
import type {ContractData} from "@features/sandbox/lib/contract.ts"

export const bigintToAddress = (addr: bigint | undefined): Address | undefined => {
  try {
    return addr ? Address.parseRaw(`0:${addr.toString(16)}`) : undefined
  } catch {
    return undefined
  }
}

export function findOpcodeAbi(
  tx: TransactionInfo,
  contracts: Map<string, ContractData>,
  opcode: number | undefined,
) {
  const thisAddress = bigintToAddress(tx?.transaction?.address)
  if (thisAddress) {
    const contract = contracts.get(thisAddress.toString())
    if (contract?.meta?.abi) {
      const found = contract?.meta?.abi.types?.find(it => it.header === opcode)
      if (found) return found
    }

    for (const contract of [...contracts.values()]) {
      const found = contract?.meta?.abi?.types?.find(it => it.header === opcode)
      if (found) return found
    }
  }
  return undefined
}

// eslint-disable-next-line functional/type-declaration-immutability
export type ParsedSlice =
  | number
  | bigint
  | Address
  | Cell
  | Slice
  | null
  | {readonly $: "sub-object"; readonly value: Record<string, ParsedSlice> | undefined}

export function parseSliceWithAbiType(
  init: Slice,
  abi: ABIType,
  allAbi: ABIType[],
): Record<string, ParsedSlice> | undefined {
  const res: Record<string, ParsedSlice> = {}

  for (const [index, field] of abi.fields.entries()) {
    try {
      if (field.type.kind === "simple") {
        if (field.type.type === "address") {
          if (field.type.optional) {
            res[field.name] = init.loadMaybeAddress()
          } else {
            res[field.name] = init.loadAddress()
          }
        } else if (field.type.type === "bool") {
          res[field.name] = init.loadUintBig(1)
        } else if (field.type.type === "uint" && typeof field.type.format === "number") {
          res[field.name] = init.loadUintBig(field.type.format)
        } else if (field.type.type === "int" && typeof field.type.format === "number") {
          res[field.name] = init.loadIntBig(field.type.format)
        } else if (field.type.type === "uint" && typeof field.type.format === "string") {
          if (field.type.format === "varuint16") {
            res[field.name] = init.loadVarUintBig(4)
          } else if (field.type.format === "varuint32") {
            res[field.name] = init.loadVarUintBig(8)
          } else if (field.type.format === "coins") {
            res[field.name] = init.loadCoins()
          }
        } else if (field.type.type === "int" && typeof field.type.format === "string") {
          if (field.type.format === "varint16") {
            res[field.name] = init.loadVarIntBig(4)
          } else if (field.type.format === "varint32") {
            res[field.name] = init.loadVarUintBig(8)
          }
        } else if (field.type.type === "cell" || field.type.type === "string") {
          if (field.type.optional) {
            const hasValue = init.loadUint(1)
            if (hasValue) {
              res[field.name] = init.loadRef()
            }
          } else {
            res[field.name] = init.loadRef()
          }
        } else if (field.type.format === "ref") {
          res[field.name] = init.loadRef()
        } else if (field.type.type === "slice" && field.type.format === "remainder") {
          res[field.name] = init.asCell().asSlice()
        } else {
          const name = field.type.type
          if (field.type.optional) {
            const hasValue = init.loadUint(1)
            if (hasValue) {
              const otherType = allAbi.find(it => it.name === name)
              if (otherType) {
                res[field.name] = {
                  $: "sub-object",
                  value: parseSliceWithAbiType(init.loadRef().asSlice(), otherType, allAbi),
                }
              }
            } else {
              res[field.name] = null
            }
            continue
          } else {
            const otherType = allAbi.find(it => it.name === name)
            if (otherType) {
              res[field.name] = {
                $: "sub-object",
                value: parseSliceWithAbiType(init.loadRef().asSlice(), otherType, allAbi),
              }
            }
          }

          console.log("skip", field)
          return undefined
        }
      }
    } catch (error) {
      console.error(`Error while parsing ${field.name} of ${abi.name} at index ${index}: ${error}`)
    }
  }

  return res
}
