import {runtime as i, text} from "ton-assembly-test-dev/dist"
import type {Address, Contract, ContractProvider, Sender, StateInit, TupleReader} from "@ton/core"
import {Cell, contractAddress, toNano, TupleBuilder} from "@ton/core"
import {GetMethodError, type SandboxContract, type TreasuryContract} from "@ton/sandbox"
import {Blockchain} from "@ton/sandbox"
import {createMappingInfo, type MappingInfo} from "ton-assembly-test-dev/dist/trace/mapping"

import {createTraceInfoPerTransaction, type TraceInfo} from "ton-assembly-test-dev/dist/trace"

import {type ExitCode, findExitCode} from "@features/txTrace/lib/traceTx.ts"

export const executeInstructions = async (
  codeCell: Cell,
  id: number = 0,
): Promise<[TupleReader, string]> => {
  class TestContract implements Contract {
    public readonly address: Address
    public readonly init?: StateInit

    public constructor(address: Address, init?: StateInit) {
      this.address = address
      this.init = init
    }

    public async send(
      provider: ContractProvider,
      via: Sender,
      args: {value: bigint; bounce?: boolean | null | undefined},
      body: Cell,
    ) {
      await provider.internal(via, {...args, body: body})
    }

    public async getAny(provider: ContractProvider, id: number): Promise<[TupleReader, string]> {
      const builder = new TupleBuilder()
      const res = await provider.get(id, builder.build())

      // @ts-expect-error TS2551
      return [res.stack, res.vmLogs]
    }
  }

  const blockchain: Blockchain = await Blockchain.create()
  blockchain.verbosity.print = false
  blockchain.verbosity.vmLogs = "vm_logs_verbose"
  const treasure: SandboxContract<TreasuryContract> = await blockchain.treasury("treasure")

  const init: StateInit = {
    code: codeCell,
    data: new Cell(),
  }

  const address = contractAddress(0, init)
  const contract = new TestContract(address, init)

  const openContract = blockchain.openContract(contract)

  // Deploy
  await openContract.send(
    treasure.getSender(),
    {
      value: toNano("10"),
    },
    new Cell(),
  )

  const [stack, vmLogs] = await openContract.getAny(id)
  return [stack, vmLogs]
}

export interface AssemblyExecutionResult {
  readonly stack: TupleReader
  readonly vmLogs: string
  readonly instructions: i.Instr[]
  readonly code: string
  readonly mappingInfo: MappingInfo | null
  readonly exitCode: ExitCode | undefined
  readonly traceInfo: TraceInfo | undefined
}

export class TasmCompilationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "TasmCompilationError"
  }
}

export const executeAssemblyCode = async (
  assemblyCode: string,
): Promise<AssemblyExecutionResult> => {
  const parseResult = text.parse("playground.tasm", assemblyCode)

  if (parseResult.$ === "ParseFailure") {
    const loc = parseResult.error.loc
    const pos = loc.file + ":" + loc.line
    throw new TasmCompilationError(pos + ": " + parseResult.error.message)
  }

  const [codeCell, mapping] = i.compileCellWithMapping(parseResult.instructions)
  const mappingInfo = createMappingInfo(mapping)

  try {
    const [stack, vmLogs] = await executeInstructions(codeCell)

    const traceInfo = createTraceInfoPerTransaction(vmLogs, mappingInfo, undefined)[0]

    return {
      stack,
      vmLogs,
      instructions: parseResult.instructions,
      code: assemblyCode,
      mappingInfo,
      exitCode: undefined,
      traceInfo,
    }
  } catch (error: unknown) {
    if (error instanceof GetMethodError) {
      const exitCode = findExitCode(error.vmLogs, mappingInfo)
      console.log(exitCode)
      return {
        stack: {items: [], remaining: 0} as unknown as TupleReader,
        vmLogs: error.vmLogs,
        instructions: parseResult.instructions,
        code: assemblyCode,
        mappingInfo,
        exitCode,
        traceInfo: undefined,
      }
    }

    throw error
  }
}
