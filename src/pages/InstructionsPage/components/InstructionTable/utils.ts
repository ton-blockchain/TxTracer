import type {GasConsumptionEntry} from "@features/spec/tvm-specification.types.ts"

export const formatGasRanges = (gasCosts: readonly GasConsumptionEntry[]): string => {
  if (!gasCosts || gasCosts.length === 0) {
    return "N/A"
  }

  const formula = gasCosts.find(it => it.formula !== undefined)
  const nonFormulaCosts = gasCosts.filter(it => it.formula === undefined)

  if (nonFormulaCosts.length === 0 && formula?.formula !== undefined) {
    return formula.formula
  }
  const numericValues = nonFormulaCosts.map(it => it.value)
  const sortedCosts = [...numericValues].sort((a, b) => a - b)

  const resultParts: string[] = []
  let startIndex = 0

  for (let i = 0; i < sortedCosts.length; i++) {
    if (i === sortedCosts.length - 1 || sortedCosts[i + 1] !== sortedCosts[i] + 1) {
      if (startIndex === i) {
        resultParts.push(sortedCosts[i].toString())
      } else {
        resultParts.push(`${sortedCosts[startIndex]}-${sortedCosts[i]}`)
      }
      startIndex = i + 1
    }
  }
  const baseGas = resultParts.filter(it => it !== "36").join(" | ")
  if (formula) {
    return `${baseGas} + ${formula.formula}`
  }
  return baseGas
}
