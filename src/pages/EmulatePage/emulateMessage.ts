import {
  Blockchain,
  type BlockchainTransaction,
  EmulationError,
  RemoteBlockchainStorage,
  SmartContract,
  wrapTonClient4ForRemote,
} from "@ton/sandbox"
import {
  Address,
  beginCell,
  Cell,
  storeShardAccount,
  storeStateInit,
  storeTransaction,
  type Transaction,
} from "@ton/core"

import {TonClient4} from "@ton/ton"

import type {ContractRawData} from "@features/sandbox/lib/transport/contract"
import type {RawTransactionInfo} from "@features/sandbox/lib/transport/transaction.ts"
import type {ValueFlow, MessageTestData} from "@features/sandbox/lib/transport/message.ts"

export interface EmulationResult {
  readonly testData: MessageTestData
  readonly errors: readonly EmulationError[]
  readonly error?: string
}

async function createBlockchain(testnet: boolean) {
  return await Blockchain.create({
    storage: new RemoteBlockchainStorage(
      wrapTonClient4ForRemote(
        new TonClient4({
          endpoint: `https://${testnet ? "sandbox" : "mainnet"}-v4.tonhubapi.com`,
        }),
      ),
    ),
  })
}

export async function emulateMessage(
  hexMessages: string[],
  testnet: boolean,
  ignoreChksig: boolean = false,
): Promise<EmulationResult> {
  try {
    const blockchain = await createBlockchain(testnet)
    blockchain.verbosity.print = false
    blockchain.verbosity.vmLogs = "vm_logs_verbose"

    const errors: EmulationError[] = []

    for (const hexMessage of hexMessages) {
      const message = Cell.fromHex(hexMessage.trim())
      try {
        await blockchain.sendMessage(message, {
          ignoreChksig,
        })
      } catch (error) {
        if (error instanceof EmulationError) {
          errors.push(error)
          continue
        }

        throw error
      }
    }

    // @ts-expect-error blockchain.transactions is not typed in @ton/sandbox
    const txs = blockchain.transactions

    const contracts: Map<string, SmartContract> = new Map()
    for (const tx of txs) {
      const destAddr = tx.inMessage?.info.dest
      if (!destAddr || !(destAddr instanceof Address)) {
        continue
      }
      contracts.set(destAddr.toString(), await blockchain.getContract(destAddr))
      const srcAddr = tx.inMessage?.info.dest
      if (!srcAddr || !(srcAddr instanceof Address)) {
        continue
      }
      contracts.set(destAddr.toString(), await blockchain.getContract(srcAddr))
    }

    const currentBlockchain = await createBlockchain(testnet)

    const valueFlow: Map<string, ValueFlow> = new Map()

    for (const [, contractAfter] of contracts) {
      const contractBefore = await currentBlockchain.getContract(contractAfter.address)

      valueFlow.set(contractAfter.address.toString(), {
        before: contractBefore.account.account?.storage.balance.coins ?? 0n,
        after: contractAfter.account.account?.storage.balance.coins ?? 0n,
      })
    }

    const data = serializeTransactions(txs)

    const testData: MessageTestData = {
      $: "test-data" as const,
      testName:
        hexMessages.length === 1 ? "Emulated Message" : `Emulated Messages (${hexMessages.length})`,
      transactions: data,
      contracts: [...contracts.values()].map(contract => {
        const stateInit =
          contract.accountState?.type === "active"
            ? beginCell()
                .store(storeStateInit(contract.accountState.state))
                .endCell()
                .toBoc()
                .toString("hex")
            : undefined

        const account = beginCell()
          .store(storeShardAccount(contract.account))
          .endCell()
          .toBoc()
          .toString("hex")

        return {
          address: contract.address.toString(),
          account: account,
          stateInit: stateInit,
          meta: undefined,
        } satisfies ContractRawData
      }),
      changes: [],
      valueFlow,
    }

    return {
      testData,
      errors,
    }
  } catch (error) {
    return {
      testData: {
        $: "test-data" as const,
        testName: undefined,
        transactions: "",
        contracts: [],
        changes: [],
        valueFlow: new Map(),
      },
      error: error instanceof Error ? error.message : String(error),
      errors: [],
    }
  }
}

export interface RawTransactionsInfo {
  readonly transactions: readonly RawTransactionInfo[]
}

function serializeTransactions(transactions: BlockchainTransaction[]): string {
  const dump: RawTransactionsInfo = {
    transactions: transactions.map((t): RawTransactionInfo => {
      const tx = beginCell()
        .store(storeTransaction(t as Transaction))
        .endCell()
        .toBoc()
        .toString("hex")

      return {
        transaction: tx,
        parsedTransaction: undefined,
        fields: {
          blockchainLogs: t.blockchainLogs,
          vmLogs: t.vmLogs,
          debugLogs: t.debugLogs,
        },
        parentId: t.parent?.lt.toString() ?? "",
        childrenIds: t.children?.map(c => c?.lt?.toString()),
      }
    }),
  }
  return JSON.stringify(dump, null, 2)
}
