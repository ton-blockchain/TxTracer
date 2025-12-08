import React from "react"

import type {Instruction} from "@features/spec/specification-schema.ts"

import styles from "./ReferenceBubble.module.css"

// interface ReferenceInfo {
//   readonly name: string
//   readonly type: "stack" | "operand"
//   readonly description?: string
//   readonly validValues?: string
//   readonly details?: string
// }

interface ReferenceBubbleProps {
  readonly name: string
  readonly instruction: Instruction
}

// TODO
// interface ParameterDef {
//   readonly type: string
//   readonly bits: string
//   readonly signed: string
//   readonly const_value: string
//   readonly description: string
// }

// const getStackEntrySummary = (entry: StackEntry): string => {
//   const parts: string[] = []
//
//   switch (entry.type) {
//     case "simple":
//       if (entry.value_types && entry.value_types.length > 0) {
//         parts.push(`Types: ${entry.value_types.join(", ")}`)
//       } else {
//         parts.push("Type: Any")
//       }
//       break
//     case "const":
//       parts.push(`Type: ${entry.value_type}, Value: ${entry.value}`)
//       break
//     case "array": {
//       let repType = "Any"
//       const first = entry.array_entry?.[0]
//       if (first) {
//         if (first.type === "simple") repType = first.value_types?.[0] ?? "Any"
//         else if (first.type === "const") repType = first.value_type ?? "Any"
//       }
//       parts.push(`Array of ${repType}, Length Var: ${entry.length_var || "N/A"}`)
//       break
//     }
//     case "conditional":
//       parts.push("Conditional stack structure. See signature for details.")
//       break
//     default:
//       parts.push("Unknown stack entry type.")
//   }
//   return parts.join("; ")
// }

// const getParameterDefSummary = (param: ParameterDef): string => {
//   const parts: string[] = []
//   parts.push(`Type: ${param.type}`)
//   if (param.bits !== undefined) parts.push(`Bits: ${param.bits}`)
//   if (param.signed !== undefined) parts.push(`Signed: ${param.signed}`)
//   if (param.const_value !== undefined) parts.push(`Const Value: ${param.const_value}`)
//   if (param.description) parts.push(param.description)
//   return parts.join("; ")
// }

const ReferenceBubble: React.FC<ReferenceBubbleProps> = ({name}) => {
  // const [isHovered, setIsHovered] = useState(false)

  // const info = useMemo((): ReferenceInfo | null => {
  //   // const operandParamDef = instruction.description?.operands?.find(p => p === name)
  //   // if (operandParamDef) {
  //   //   return {
  //   //     name,
  //   //     type: "operand",
  //   //     description: `Operand: ${name}`,
  //   //     validValues: getParameterDefSummary(operandParamDef),
  //   //   }
  //   // }
  //
  //   // 2. Check stack items
  //   const stackInputs = instruction.signature?.inputs?.stack ?? []
  //   const stackOutputs = instruction.signature?.outputs?.stack ?? []
  //   const allStackEntries = [...stackInputs, ...stackOutputs]
  //
  //   // TODO: Add recursive search for nested stack entries if needed (e.g., inside conditionals)
  //   const stackEntryDef = allStackEntries.find(s => s.type === "simple" && s.name === name)
  //   if (stackEntryDef) {
  //     return {
  //       name,
  //       type: "stack",
  //       description: `Stack Item: ${name}`,
  //       validValues: getStackEntrySummary(stackEntryDef),
  //     }
  //   }
  //
  //   return null
  // }, [name, instruction])

  return <span className={styles.text}>{name}</span>

  // if (!info) {
  //   return <span className={`${styles.bubble} ${styles.notFound}`}>${name} (ref not found)</span>
  // }
  //
  // return (
  //   <span
  //     className={`${styles.bubble} ${info.type === "operand" ? styles.operandBubble : styles.stackBubble}`}
  //     onMouseEnter={() => setIsHovered(true)}
  //     onMouseLeave={() => setIsHovered(false)}
  //     tabIndex={0}
  //     role="button"
  //     aria-describedby={isHovered ? `popover-${name}-${info.type}` : undefined}
  //   >
  //     {name}
  //     {isHovered && (
  //       <div className={styles.popover} id={`popover-${name}-${info.type}`} role="tooltip">
  //         <strong className={styles.popoverTitle}>${info.name}</strong> ({info.type})
  //         {info.description && <p className={styles.popoverSection}>{info.description}</p>}
  //         {info.validValues && (
  //           <p className={styles.popoverSection}>
  //             <strong>Details:</strong> {info.validValues}
  //           </p>
  //         )}
  //         {info.details && <p className={styles.popoverSection}>{info.details}</p>}
  //       </div>
  //     )}
  //   </span>
  // )
}

export default ReferenceBubble
