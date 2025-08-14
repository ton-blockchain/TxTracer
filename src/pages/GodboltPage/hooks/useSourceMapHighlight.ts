import React, {useCallback, useMemo, useState} from "react"
import type * as monaco from "monaco-editor"

import {trace} from "ton-assembly"
import {type TolkMapping, type TolkSourceLoc} from "@ton/tolk-js/dist/mapping"
import type {FuncSourceLoc} from "ton-assembly/dist/trace"

import type {HighlightGroup, HighlightRange} from "@shared/ui/CodeEditor"

export interface UseSourceMapHighlightReturn {
  readonly funcHighlightGroups: readonly HighlightGroup[]
  readonly asmHighlightGroups: readonly HighlightGroup[]
  readonly funcHoveredLines: readonly number[]
  readonly asmHoveredLines: readonly number[]
  readonly funcPreciseHighlightRanges: readonly HighlightRange[]
  readonly handleFuncLineHover: (line: number | null) => void
  readonly handleAsmLineHover: (line: number | null) => void
  readonly getVariablesForAsmLine: (line: number) => trace.FuncVar[] | undefined
}

const COLORS = [
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#96CEB4",
  "#FFEAA7",
  "#DDA0DD",
  "#98D8C8",
  "#F7DC6F",
  "#BB8FCE",
  "#85C1E9",
]

interface MappingGroup {
  readonly funcLines: readonly number[]
  readonly asmLines: readonly number[]
  readonly color: string
  readonly className: string
}

interface QueueItem {
  readonly type: "func" | "asm"
  readonly line: number
}

function findConnectedComponents(
  funcToAsmMap: Map<number, number[]>,
  asmToFuncMap: Map<number, number[]>,
): MappingGroup[] {
  const visited = new Set<string>()
  const components: MappingGroup[] = []

  const getAllConnected = (
    startFuncLine: number,
  ): {funcLines: Set<number>; asmLines: Set<number>} => {
    const funcLines = new Set<number>()
    const asmLines = new Set<number>()
    const queue: QueueItem[] = [{type: "func", line: startFuncLine}]
    const localVisited = new Set<string>()

    while (queue.length > 0) {
      const current = queue.shift()
      if (!current) continue

      const key = `${current.type}:${current.line}`
      if (localVisited.has(key)) continue
      localVisited.add(key)

      if (current.type === "func") {
        funcLines.add(current.line)

        const relatedAsmLines = funcToAsmMap.get(current.line) || []
        for (const asmLine of relatedAsmLines) {
          if (!localVisited.has(`asm:${asmLine}`)) {
            queue.push({type: "asm", line: asmLine})
          }
        }
      } else if (current.type === "asm") {
        asmLines.add(current.line)

        const relatedFuncLines = asmToFuncMap.get(current.line) || []
        for (const funcLine of relatedFuncLines) {
          if (!localVisited.has(`func:${funcLine}`)) {
            queue.push({type: "func", line: funcLine})
          }
        }
      }
    }

    return {funcLines, asmLines}
  }

  let colorIndex = 0

  for (const funcLine of funcToAsmMap.keys()) {
    const key = `func:${funcLine}`
    if (visited.has(key)) continue

    const {funcLines, asmLines} = getAllConnected(funcLine)

    for (const fl of funcLines) visited.add(`func:${fl}`)
    for (const al of asmLines) visited.add(`asm:${al}`)

    if (funcLines.size > 0 && asmLines.size > 0) {
      const color = COLORS[colorIndex % COLORS.length]
      components.push({
        funcLines: Array.from(funcLines).sort((a, b) => a - b),
        asmLines: Array.from(asmLines).sort((a, b) => a - b),
        color,
        className: `source-map-group-${colorIndex % 10}`,
      })
      colorIndex++
    }
  }

  return components
}

export function useSourceMapHighlight(
  sourceMap: trace.FuncMapping | TolkMapping | undefined,
  debugSectionToInstructions?: Map<number, trace.InstructionInfo[]>,
  funcEditorRef?: React.RefObject<monaco.editor.IStandaloneCodeEditor | null>,
  asmEditorRef?: React.RefObject<monaco.editor.IStandaloneCodeEditor | null>,
): UseSourceMapHighlightReturn {
  const [hoveredFuncLine, setHoveredFuncLine] = useState<number | null>(null)
  const [hoveredAsmLine, setHoveredAsmLine] = useState<number | null>(null)

  const {funcToAsmMap, asmToFuncMap, mappingGroups} = useMemo(() => {
    if (!sourceMap || !debugSectionToInstructions) {
      return {
        funcToAsmMap: new Map<number, number[]>(),
        asmToFuncMap: new Map<number, number[]>(),
        mappingGroups: [],
      }
    }

    const funcToAsm = new Map<number, Set<number>>()
    const asmToFunc = new Map<number, Set<number>>()

    let waitingSections: (FuncSourceLoc | TolkSourceLoc)[] = []

    for (const [debugId, location] of sourceMap.locations.entries()) {
      const funcLine = location.line

      const instructions = debugSectionToInstructions.get(debugId)
      if (!instructions || instructions.length === 0) {
        if (location.file === "" || location.file.includes("@stdlib")) {
          continue
        }
        waitingSections.push(location)
        continue
      }

      const asmLineNumbers: number[] = []
      for (const instr of instructions) {
        if (instr.loc && instr.loc.line !== undefined) {
          const asmLine = instr.loc.line + 1
          asmLineNumbers.push(asmLine)
        }
      }

      if (asmLineNumbers.length === 0) {
        waitingSections = []
        continue
      }

      if (!funcToAsm.has(funcLine)) {
        funcToAsm.set(funcLine, new Set())
      }
      for (const asmLine of asmLineNumbers) {
        funcToAsm.get(funcLine)?.add(asmLine)

        if (!asmToFunc.has(asmLine)) {
          asmToFunc.set(asmLine, new Set())
        }
        asmToFunc.get(asmLine)?.add(funcLine)
      }

      if (waitingSections.length > 0) {
        for (const section of waitingSections) {
          const waitingFuncLine = section.line
          if (!funcToAsm.has(waitingFuncLine)) {
            funcToAsm.set(waitingFuncLine, new Set())
          }

          for (const asmLine of asmLineNumbers) {
            funcToAsm.get(waitingFuncLine)?.add(asmLine)

            if (!asmToFunc.has(asmLine)) {
              asmToFunc.set(asmLine, new Set())
            }
            asmToFunc.get(asmLine)?.add(waitingFuncLine)
          }
        }
        waitingSections = []
      }
    }

    const finalFuncToAsmMapping: Map<number, number[]> = new Map(
      [...funcToAsm.entries()].map(([key, value]) => [
        key,
        [...value.values()].sort((a, b) => a - b),
      ]),
    )
    const finalAsmToFuncMapping: Map<number, number[]> = new Map(
      [...asmToFunc.entries()].map(([key, value]) => [
        key,
        [...value.values()].sort((a, b) => a - b),
      ]),
    )

    const components = findConnectedComponents(finalFuncToAsmMapping, finalAsmToFuncMapping)

    return {
      funcToAsmMap: finalFuncToAsmMapping,
      asmToFuncMap: finalAsmToFuncMapping,
      mappingGroups: components,
    }
  }, [sourceMap, debugSectionToInstructions])

  const {funcHighlightGroups, asmHighlightGroups} = useMemo(() => {
    const funcGroups: HighlightGroup[] = []
    const asmGroups: HighlightGroup[] = []

    for (const group of mappingGroups) {
      funcGroups.push({
        lines: [...group.funcLines],
        color: group.color,
        className: group.className,
      })

      asmGroups.push({
        lines: [...group.asmLines],
        color: group.color,
        className: group.className,
      })
    }

    return {funcHighlightGroups: funcGroups, asmHighlightGroups: asmGroups}
  }, [mappingGroups])

  const handleFuncLineHover = useCallback(
    (line: number | null) => {
      setHoveredFuncLine(line)

      if (line && funcToAsmMap.has(line) && asmEditorRef?.current) {
        const correspondingLines = funcToAsmMap.get(line)
        if (correspondingLines && correspondingLines?.length > 0) {
          const targetLine = correspondingLines[0]

          asmEditorRef.current.revealLineInCenterIfOutsideViewport(targetLine)
        }
      }
    },
    [funcToAsmMap, asmEditorRef],
  )

  const handleAsmLineHover = useCallback(
    (line: number | null) => {
      setHoveredAsmLine(line)

      if (line && asmToFuncMap.has(line) && funcEditorRef?.current) {
        const correspondingLines = asmToFuncMap.get(line)
        if (correspondingLines && correspondingLines?.length > 0) {
          const targetLine = correspondingLines[0]

          funcEditorRef.current.revealLineInCenterIfOutsideViewport(targetLine)
        }
      }
    },
    [asmToFuncMap, funcEditorRef],
  )

  const funcHoveredLines = useMemo(() => {
    if (hoveredAsmLine && asmToFuncMap.has(hoveredAsmLine)) {
      return asmToFuncMap.get(hoveredAsmLine) ?? []
    }
    return []
  }, [hoveredAsmLine, asmToFuncMap])

  const asmHoveredLines = useMemo(() => {
    if (hoveredFuncLine && funcToAsmMap.has(hoveredFuncLine)) {
      return funcToAsmMap.get(hoveredFuncLine) ?? []
    }
    return []
  }, [hoveredFuncLine, funcToAsmMap])

  const funcPreciseHighlightRanges = useMemo((): HighlightRange[] => {
    if (!hoveredAsmLine || !sourceMap || !debugSectionToInstructions) {
      return []
    }

    for (const [debugId, location] of sourceMap.locations.entries()) {
      if (location.file !== "main.fc" && location.file !== "main.tolk") {
        continue
      }

      const instructions = debugSectionToInstructions.get(debugId)
      if (!instructions || instructions.length === 0) {
        continue
      }

      for (const instr of instructions) {
        if (instr.loc?.line !== undefined) {
          const asmLine = instr.loc.line + 1
          if (asmLine === hoveredAsmLine) {
            return [
              {
                line: location.line,
                startColumn: location.pos,
                endColumn: location.pos + location.length,
                color: "#FF0000",
                className: "precise-highlight",
              },
            ]
          }
        }
      }
    }

    return []
  }, [hoveredAsmLine, sourceMap, debugSectionToInstructions])

  return {
    funcHighlightGroups,
    asmHighlightGroups,
    funcHoveredLines,
    asmHoveredLines,
    funcPreciseHighlightRanges,
    handleFuncLineHover,
    handleAsmLineHover,
    getVariablesForAsmLine: () => undefined,
  }
}
