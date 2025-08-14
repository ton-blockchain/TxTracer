export const formatGasRanges = (gasCosts: readonly number[]): string => {
  if (!gasCosts || gasCosts.length === 0) {
    return "N/A"
  }

  const sortedCosts = [...gasCosts].sort((a, b) => a - b)

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
  return resultParts.filter(it => it !== "36").join(" | ")
}
