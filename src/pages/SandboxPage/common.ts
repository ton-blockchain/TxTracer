import {Address} from "@ton/core"

import type {ContractData, TransactionInfo} from "@app/pages/SandboxPage/SandboxPage.tsx"

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
