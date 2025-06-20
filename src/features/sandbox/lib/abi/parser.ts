import {type ABIType, Address, Cell, type Slice} from "@ton/core"

export type ParsedObjectByABI = Record<string, ParsedSlice>

export type SubObject = {
  readonly $: "sub-object"
  readonly value: ParsedObjectByABI | undefined
}

// eslint-disable-next-line functional/type-declaration-immutability
export type ParsedSlice = number | bigint | Address | Cell | Slice | SubObject | null

export function parseSliceWithAbiType(
  init: Slice,
  abi: ABIType,
  allAbi: ABIType[],
): ParsedObjectByABI | undefined {
  const res: ParsedObjectByABI = {}

  let slice = init

  const fields = abi.fields
  for (let index = 0; index < fields.length; index++) {
    const field = fields[index]

    try {
      if (field.type.kind === "simple") {
        if (field.type.type === "address") {
          if (field.type.optional) {
            res[field.name] = slice.loadMaybeAddress()
          } else {
            res[field.name] = slice.loadAddress()
          }
        } else if (field.type.type === "bool") {
          res[field.name] = slice.loadUintBig(1)
        } else if (field.type.type === "uint" && typeof field.type.format === "number") {
          res[field.name] = slice.loadUintBig(field.type.format)
        } else if (field.type.type === "int" && typeof field.type.format === "number") {
          res[field.name] = slice.loadIntBig(field.type.format)
        } else if (field.type.type === "uint" && typeof field.type.format === "string") {
          if (field.type.format === "varuint16") {
            res[field.name] = slice.loadVarUintBig(4)
          } else if (field.type.format === "varuint32") {
            res[field.name] = slice.loadVarUintBig(8)
          } else if (field.type.format === "coins") {
            res[field.name] = slice.loadCoins()
          }
        } else if (field.type.type === "int" && typeof field.type.format === "string") {
          if (field.type.format === "varint16") {
            res[field.name] = slice.loadVarIntBig(4)
          } else if (field.type.format === "varint32") {
            res[field.name] = slice.loadVarUintBig(8)
          }
        } else if (field.type.type === "cell" || field.type.type === "string") {
          if (field.type.optional) {
            const hasValue = slice.loadUint(1)
            if (hasValue) {
              res[field.name] = slice.loadRef()
            }
          } else {
            res[field.name] = slice.loadRef()
          }
        } else if (field.type.format === "ref") {
          res[field.name] = slice.loadRef()
        } else if (field.type.type === "slice" && field.type.format === "remainder") {
          res[field.name] = slice.asCell().asSlice()
        } else {
          const name = field.type.type
          if (field.type.optional) {
            const hasValue = slice.loadUint(1)
            if (hasValue) {
              const otherType = allAbi.find(it => it.name === name)
              if (otherType) {
                res[field.name] = {
                  $: "sub-object",
                  value: parseSliceWithAbiType(slice, otherType, allAbi),
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
                value: parseSliceWithAbiType(slice, otherType, allAbi),
              }
              continue
            }
          }

          console.log("skip", field)
          return undefined
        }
      }
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("is out of bounds") &&
        slice.remainingRefs > 0
      ) {
        console.log("retry")

        index--

        slice = slice.loadRef().beginParse()
        continue
      }

      console.error(`Error while parsing ${field.name} of ${abi.name} at index ${index}: ${error}`)
    }
  }

  return res
}
