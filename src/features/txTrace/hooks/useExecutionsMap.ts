import {useMemo} from "react"
import type {TraceInfo} from "tact-asm/dist/trace"

export function useExecutionsMap(trace: TraceInfo | undefined): Record<number, number> {
  return useMemo(() => {
    if (!trace || !trace.steps.length) return {}

    const map: Record<number, number> = {}
    for (const step of trace.steps) {
      if (step.loc !== undefined) {
        const line = step.loc.line + 1
        map[line] = (map[line] ?? 0) + 1
      }
    }
    return map
  }, [trace])
}
