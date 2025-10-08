import {
  Blockchain,
  type BlockchainTransaction,
  RemoteBlockchainStorage,
  wrapTonClient4ForRemote,
  SmartContract,
  EmulationError,
} from "@ton/sandbox"
import {
  Address,
  Cell,
  loadMessage,
  beginCell,
  storeStateInit,
  storeShardAccount,
  storeTransaction,
  type Transaction,
} from "@ton/core"

import {TonClient4} from "@ton/ton"

import type {ContractRawData, ContractStateChange} from "@features/sandbox/lib/transport/contract"
import type {RawTransactionInfo} from "@features/sandbox/lib/transport/transaction.ts"

export interface EmulationResult {
  readonly testData: {
    readonly $: "test-data"
    readonly testName: string | undefined
    readonly transactions: string
    readonly contracts: readonly ContractRawData[]
    readonly changes: readonly ContractStateChange[]
  }
  readonly errors: readonly EmulationError[]
  readonly error?: string
}

export async function emulateMessage(
  hexMessages: string[],
  testnet: boolean,
  ignoreChksig: boolean = false,
): Promise<EmulationResult> {
  try {
    const blockchain = await Blockchain.create({
      storage: new RemoteBlockchainStorage(
        wrapTonClient4ForRemote(
          new TonClient4({
            endpoint: `https://${testnet ? "sandbox" : "mainnet"}-v4.tonhubapi.com`,
          }),
        ),
      ),
    })
    blockchain.verbosity.print = false
    blockchain.verbosity.vmLogs = "vm_logs_verbose"

    const errors: EmulationError[] = []

    for (const hexMessage of hexMessages) {
      const message = Cell.fromHex(hexMessage.trim())
      loadMessage(message.asSlice())
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

    const contracts: SmartContract[] = []
    for (const tx of txs) {
      const addr = tx.inMessage?.info.dest
      if (!addr || !(addr instanceof Address)) {
        continue
      }
      contracts.push(await blockchain.getContract(addr))
    }

    const data = serializeTransactions(txs)

    const testData = {
      $: "test-data" as const,
      testName:
        hexMessages.length === 1 ? "Emulated Message" : `Emulated Messages (${hexMessages.length})`,
      transactions: data,
      contracts: contracts.map(contract => {
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
