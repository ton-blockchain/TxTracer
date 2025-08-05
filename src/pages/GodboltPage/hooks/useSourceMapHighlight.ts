import React, {useCallback, useMemo, useState} from "react"
import type * as monaco from "monaco-editor"

import {trace} from "ton-assembly/dist"

import type {HighlightGroup, HighlightRange} from "@shared/ui/CodeEditor"

export interface UseSourceMapHighlightReturn {
  readonly funcHighlightGroups: readonly HighlightGroup[]
  readonly asmHighlightGroups: readonly HighlightGroup[]
  readonly funcHoveredLines: readonly number[]
  readonly asmHoveredLines: readonly number[]
  readonly funcPreciseHighlightRanges: readonly HighlightRange[]
  readonly handleFuncLineHover: (line: number | null) => void
  readonly handleAsmLineHover: (line: number | null) => void
  readonly filteredAsmCode: string
  readonly getVariablesForAsmLine: (line: number) => trace.FuncVar[] | undefined
}

function filterDebugMarks(asmCode: string): {
  filteredCode: string
  originalToFiltered: Map<number, number>
  filteredToOriginal: Map<number, number>
  asmLineToDebugMark: Map<number, number>
} {
  const lines = asmCode.split("\n")
  const filteredLines: string[] = []
  const originalToFiltered = new Map<number, number>()
  const filteredToOriginal = new Map<number, number>()
  const asmLineToDebugMark = new Map<number, number>()

  let filteredLineNumber = 1
  let currentDebugMark: number | null = null

  for (let i = 0; i < lines.length; i++) {
    const originalLineNumber = i + 1
    const line = lines[i].trim()

    if (line.startsWith("DEBUGMARK ")) {
      const debugMarkMatch = line.match(/DEBUGMARK (\d+)/)
      if (debugMarkMatch) {
        currentDebugMark = parseInt(debugMarkMatch[1], 10)
      }
      continue
    }

    if (currentDebugMark !== null) {
      asmLineToDebugMark.set(filteredLineNumber, currentDebugMark)
    }

    filteredLines.push(lines[i])
    originalToFiltered.set(originalLineNumber, filteredLineNumber)
    filteredToOriginal.set(filteredLineNumber, originalLineNumber)
    filteredLineNumber++
  }

  return {
    filteredCode: filteredLines.join("\n"),
    originalToFiltered,
    filteredToOriginal,
    asmLineToDebugMark,
  }
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

export function useSourceMapHighlight(
  sourceMap: trace.FuncMapping | undefined,
  debugSectionToInstructions?: Map<number, trace.InstructionInfo[]>,
  funcEditorRef?: React.RefObject<monaco.editor.IStandaloneCodeEditor | null>,
  asmEditorRef?: React.RefObject<monaco.editor.IStandaloneCodeEditor | null>,
  originalAsmCode?: string,
): UseSourceMapHighlightReturn {
  const [hoveredFuncLine, setHoveredFuncLine] = useState<number | null>(null)
  const [hoveredAsmLine, setHoveredAsmLine] = useState<number | null>(null)

  const {filteredAsmCode, originalToFiltered, asmLineToDebugMark} = useMemo(() => {
    if (!originalAsmCode) {
      return {
        filteredAsmCode: "",
        originalToFiltered: new Map<number, number>(),
        asmLineToDebugMark: new Map<number, number>(),
      }
    }
    const result = filterDebugMarks(originalAsmCode)
    return {
      filteredAsmCode: result.filteredCode,
      originalToFiltered: result.originalToFiltered,
      asmLineToDebugMark: result.asmLineToDebugMark,
    }
  }, [originalAsmCode])

  const {funcToAsmMap, asmToFuncMap} = useMemo(() => {
    if (!sourceMap || !debugSectionToInstructions) {
      return {funcToAsmMap: new Map<number, number[]>(), asmToFuncMap: new Map<number, number[]>()}
    }

    const funcToAsm = new Map<number, number[]>()
    const asmToFunc = new Map<number, number[]>()

    for (const [debugId, location] of sourceMap.locations.entries()) {
      const funcLine = location.line

      const instructions = debugSectionToInstructions.get(debugId)
      if (!instructions || instructions.length === 0) {
        continue
      }

      const asmLineNumbers: number[] = []
      for (const instr of instructions) {
        if (instr.loc && instr.loc.line !== undefined) {
          const originalAsmLine = instr.loc.line + 1
          const filteredAsmLine = originalToFiltered.get(originalAsmLine)
          if (filteredAsmLine) {
            asmLineNumbers.push(filteredAsmLine)
          }
        }
      }

      if (asmLineNumbers.length === 0) {
        continue
      }

      if (!funcToAsm.has(funcLine)) {
        funcToAsm.set(funcLine, [])
      }
      funcToAsm.get(funcLine)?.push(...asmLineNumbers)

      for (const asmLine of asmLineNumbers) {
        if (!asmToFunc.has(asmLine)) {
          asmToFunc.set(asmLine, [])
        }
        asmToFunc.get(asmLine)?.push(funcLine)
      }
    }

    return {funcToAsmMap: funcToAsm, asmToFuncMap: asmToFunc}
  }, [sourceMap, debugSectionToInstructions, originalToFiltered])

  const {funcHighlightGroups, asmHighlightGroups} = useMemo(() => {
    const funcGroups: HighlightGroup[] = []
    const asmGroups: HighlightGroup[] = []

    let colorIndex = 0

    for (const [funcLine, asmLines] of funcToAsmMap) {
      const color = COLORS[colorIndex % COLORS.length]

      funcGroups.push({
        lines: [funcLine],
        color,
        className: `source-map-group-${colorIndex % 10}`,
      })

      asmGroups.push({
        lines: asmLines,
        color,
        className: `source-map-group-${colorIndex % 10}`,
      })

      colorIndex++
    }

    return {funcHighlightGroups: funcGroups, asmHighlightGroups: asmGroups}
  }, [funcToAsmMap])

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
    if (!hoveredAsmLine || !sourceMap || !asmLineToDebugMark.has(hoveredAsmLine)) {
      return []
    }

    const debugMarkId = asmLineToDebugMark.get(hoveredAsmLine)
    if (debugMarkId === undefined) {
      return []
    }

    const location = sourceMap.locations[debugMarkId]
    if (!location || location.file !== "main.fc") {
      return []
    }

    return [
      {
        line: location.line,
        startColumn: location.pos + 1,
        endColumn: location.pos + location.length + 1,
        color: "#FF0000",
        className: "precise-highlight",
      },
    ]
  }, [hoveredAsmLine, sourceMap, asmLineToDebugMark])

  const getVariablesForAsmLine = useCallback(
    (line: number): trace.FuncVar[] | undefined => {
      if (!sourceMap || !asmLineToDebugMark.has(line)) {
        return undefined
      }

      const debugMarkId = asmLineToDebugMark.get(line)
      if (debugMarkId === undefined) {
        return undefined
      }

      const location = sourceMap.locations[debugMarkId]
      if (!location || location.file !== "main.fc") {
        return undefined
      }

      return location.vars ?? undefined
    },
    [sourceMap, asmLineToDebugMark],
  )

  return {
    funcHighlightGroups,
    asmHighlightGroups,
    funcHoveredLines,
    asmHoveredLines,
    funcPreciseHighlightRanges,
    handleFuncLineHover,
    handleAsmLineHover,
    filteredAsmCode,
    getVariablesForAsmLine,
  }
}
