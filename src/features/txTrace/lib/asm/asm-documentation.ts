import {type AsmInstruction, getStackPresentation} from "./types"

function formatOperands(operands: Record<string, number | string | undefined>): string {
  return Object.entries(operands)
    .map(([_, value]) => value?.toString() ?? "")
    .join(" ")
}

export function generateAsmDoc(instruction: AsmInstruction): string | null {
  const stackInfo = instruction.doc.stack
    ? `- Stack (top is on the right): \`${getStackPresentation(instruction.doc.stack)}\``
    : ""

  const gas = instruction.doc.gas.length > 0 ? instruction.doc.gas : `unknown`

  const actualInstructionDescription = [
    "```",
    instruction.mnemonic,
    "```",
    stackInfo,
    `- Gas: \`${gas}\``,
    "",
    instruction.doc.description,
    "",
    "",
  ]

  if (instruction.alias_info) {
    const operandsStr = formatOperands(instruction.alias_info.operands) + " "
    const aliasInfoDescription = ` alias of ${operandsStr}${instruction.alias_info.alias_of}`

    const alias = instruction.alias_info
    const stackInfo = alias.doc_stack
      ? `- Stack (top is on the right): \`${getStackPresentation(alias.doc_stack)}\``
      : ""

    return [
      "```",
      alias.mnemonic + aliasInfoDescription,
      "```",
      stackInfo,
      "",
      alias.description ?? "",
      "",
      "---",
      "",
      "Aliased instruction info:",
      "",
      ...actualInstructionDescription,
    ].join("\n")
  }

  return actualInstructionDescription.join("\n")
}
