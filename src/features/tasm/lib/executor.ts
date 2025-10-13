import {runtime as i, text, trace} from "ton-assembly"
import type {Address, Contract, ContractProvider, Sender, StateInit, TupleReader} from "@ton/core"
import {Cell, contractAddress, toNano, TupleBuilder} from "@ton/core"
import {GetMethodError, type SandboxContract, type TreasuryContract} from "@ton/sandbox"
import {Blockchain} from "@ton/sandbox"
import {createMappingInfo} from "ton-assembly/dist/trace/mapping"
import type {AssemblyMapping} from "ton-source-map"
import type {StackElement} from "ton-assembly/dist/trace"

import {type ExitCode, findExitCode} from "@features/txTrace/lib/traceTx.ts"

function stackElementsToTupleBuilder(stackElements: StackElement[]): TupleBuilder {
  const builder = new TupleBuilder()

  for (const element of stackElements) {
    switch (element.$) {
      case "Integer":
        builder.writeNumber(element.value)
        break
      case "Cell":
        try {
          const cell = Cell.fromHex(element.boc)
          builder.writeCell(cell)
        } catch {
          console.warn("Invalid cell BoC, skipping:", element.boc)
        }
        break
      case "Slice":
        try {
          const cell = Cell.fromHex(element.hex)
          builder.writeSlice(cell.beginParse())
        } catch {
          console.warn("Invalid slice hex, skipping:", element.hex)
        }
        break
      case "Null":
        // TupleBuilder doesn't have writeNull, skip null elements
        break
      default:
        console.warn("Unsupported stack element type:", element.$)
    }
  }

  return builder
}

export const executeInstructions = async (
  codeCell: Cell,
  id: number = 0,
  initialStack: StackElement[] = [],
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

    public async getAny(
      provider: ContractProvider,
      id: number,
      initialStack: StackElement[],
    ): Promise<[TupleReader, string]> {
      const builder = stackElementsToTupleBuilder(initialStack)
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

  const [stack, vmLogs] = await openContract.getAny(id, initialStack)
  return [stack, vmLogs]
}

export interface AssemblyExecutionResult {
  readonly stack: TupleReader
  readonly vmLogs: string
  readonly instructions: i.Instr[]
  readonly code: string
  readonly mappingInfo: AssemblyMapping | null
  readonly exitCode: ExitCode | undefined
  readonly traceInfo: trace.TraceInfo | undefined
}

export class TasmCompilationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "TasmCompilationError"
  }
}

export const executeAssemblyCode = async (
  assemblyCode: string,
  initialStack: StackElement[] = [],
): Promise<AssemblyExecutionResult> => {
  const parseResult = text.parse("playground.tasm", assemblyCode)

  if (parseResult.$ === "ParseFailure") {
    const loc = parseResult.error.loc
    const pos = loc.file + ":" + (loc.line + 1)
    throw new TasmCompilationError(pos + ": " + parseResult.error.message)
  }

  const [codeCell, mapping] = i.compileCellWithMapping(parseResult.instructions)
  const mappingInfo = createMappingInfo(mapping)

  try {
    const [stack, vmLogs] = await executeInstructions(codeCell, 0, initialStack)

    const traceInfo = trace.createTraceInfoPerTransaction(vmLogs, mappingInfo, undefined)[0]

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
      const traceInfo = trace.createTraceInfoPerTransaction(error.vmLogs, mappingInfo, undefined)[0]
      const exitCode = findExitCode(error.vmLogs, mappingInfo)

      return {
        stack: {items: [], remaining: 0} as unknown as TupleReader,
        vmLogs: error.vmLogs,
        instructions: parseResult.instructions,
        code: assemblyCode,
        mappingInfo,
        exitCode,
        traceInfo,
      }
    }

    throw error
  }
}
