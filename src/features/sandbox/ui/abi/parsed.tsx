import {Address} from "@ton/core"

import type {ParsedObjectByABI} from "@features/sandbox/lib/abi/parser.ts"
import type {ContractData} from "@features/sandbox/lib/contract.ts"
import {ContractChip} from "@app/pages/SandboxPage/components"

export function showRecordValues(
  data: ParsedObjectByABI,
  contracts: Map<string, ContractData>,
  fieldNameClass?: string,
  fieldValueClass?: string,
) {
  return (
    <>
      {Object.entries(data).map(([key, value]) => (
        <div key={key}>
          <span className={fieldNameClass ?? "fieldName"}>{key.toString()}: </span>
          <span className={fieldValueClass ?? "fieldValue"}>
            {value instanceof Address ? (
              contracts ? (
                <ContractChip address={value.toString()} contracts={contracts} />
              ) : (
                value.toString()
              )
            ) : value &&
              typeof value === "object" &&
              "$" in value &&
              value.$ === "sub-object" &&
              value.value ? (
              showRecordValues(value.value, contracts, fieldNameClass, fieldValueClass)
            ) : (
              // eslint-disable-next-line @typescript-eslint/no-base-to-string
              value?.toString()
            )}
          </span>
        </div>
      ))}
    </>
  )
}
