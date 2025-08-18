import type {InstructionSignature, Schema, StackEntry, StackValues} from "./stack-signatures-schema"

let signatures: Schema | undefined = undefined

export const signatureString = (signature: InstructionSignature): string => {
  const inputs = signature.inputs?.stack ?? []
  const outputs = signature.outputs?.stack ?? []
  if (inputs.length === 0 && outputs.length === 0) {
    return ""
  }
  return stackString(inputs) + " -> " + stackString(outputs)
}

const stackString = (values: StackValues): string => {
  if (values.length === 0) {
    return "∅"
  }
  return values.map(value => entryString(value)).join(" ")
}

const entryString = (entry: StackEntry): string => {
  if (entry.type === "simple") {
    const types = entry.value_types ?? []
    if (types.length === 0) {
      return entry.name + ":Any"
    }
    const typesStr = types.map(it => (it === "Int" ? "Int" : it)).join("|")
    return entry.name + ":" + typesStr
  }

  if (entry.type === "const") {
    if (entry.value === null) {
      return "null"
    }
    return entry.value.toString()
  }

  if (entry.type === "array") {
    return `x_1...x_${entry.length_var}`
  }

  const variants = entry.match
    .map(arm => "(" + stackString(arm.stack) + " " + arm.value.toString() + ")")
    .join("|")
  if (entry.else) {
    const elseValues = stackString(entry.else)
    return variants + "|" + elseValues
  }
  return variants
}

export const signatureOf = async (name: string): Promise<InstructionSignature | undefined> => {
  const fs = await import("node:fs")

  if (signatures) {
    return signatures[name]
  }

  const signaturesData = fs.readFileSync(`${__dirname}/stack-signatures-data.json`, "utf8")
  signatures = JSON.parse(signaturesData) as Schema
  const signaturesData2 = fs.readFileSync(`${__dirname}/missed-stack-signatures-data.json`, "utf8")
  signatures = {}
  const signatures2 = JSON.parse(signaturesData2) as Schema
  Object.entries(signatures2).forEach(([name, info]) => {
    if (signatures) {
      signatures[name] = info
    }
  })
  return signatures[name]
}

export const producersOf = (entry: StackEntry, terminals: boolean): string[] => {
  if (!signatures) return []
  return Object.entries(signatures)
    .filter(([_name, info]) => {
      if (!info.outputs || !info.outputs.stack || info.outputs.stack?.length !== 1) {
        return false
      }

      // if (entry.value_types?.some(it => it === "Null")) {
      //     return name === "PUSHNULL"
      // }

      const output = info.outputs.stack[0]
      if (!output) return false
      if (output.type !== "simple" || entry.type !== "simple") {
        return false // for now
      }

      if (output.value_types?.length === 2) {
        const valuesWithoutNull = output.value_types.filter(it => it !== "Null")
        if (JSON.stringify(valuesWithoutNull) !== JSON.stringify(entry.value_types)) {
          return false
        }
      } else if (entry.value_types?.length === 2) {
        const valuesWithoutNull = entry.value_types.filter(it => it !== "Null")
        if (JSON.stringify(output.value_types) !== JSON.stringify(valuesWithoutNull)) {
          return false
        }
      } else if (JSON.stringify(output.value_types) !== JSON.stringify(entry.value_types)) {
        return false
      }

      if (entry.value_types?.some(it => it === "Cell")) {
        terminals = false
      }

      const inputsStack = info?.inputs?.stack ?? []
      const inputsRegisters = info?.inputs?.registers ?? []
      if (terminals && (inputsStack.length > 0 || inputsRegisters.length > 0)) {
        // filter non-terminal instructions
        return false
      }

      // for now
      return true
    })
    .map(([name]) => name)
}

export const consumersOf = (entry: StackEntry, terminals: boolean): string[] => {
  if (!signatures) return []
  return [
    ...Object.entries(signatures)
      .filter(([_name, info]) => {
        if (!info.inputs || !info.inputs.stack || info.inputs.stack?.length !== 1) {
          return false
        }

        const input = info.inputs.stack[0]
        if (!input) return false
        if (input.type !== "simple" || entry.type !== "simple") {
          return false // for now
        }

        if (JSON.stringify(input.value_types) !== JSON.stringify(entry.value_types)) {
          return false
        }

        const outputsStack = info?.outputs?.stack ?? []
        const outputsRegisters = info?.outputs?.registers ?? []
        if (terminals && (outputsStack.length > 0 || outputsRegisters.length > 0)) {
          // filter non-terminal instructions
          return false
        }

        // for now
        return true
      })
      .map(([name]) => name),
    "DROP",
  ]
}
