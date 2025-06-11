import React, {useState, useCallback, useMemo} from "react"
import type * as monaco from "monaco-editor"

import {trace} from "ton-assembly/dist"

import type {FuncMapping} from "@features/txTrace/lib/func/func-compile"
import type {HighlightGroup} from "@shared/ui/CodeEditor/CodeEditor"

export interface UseSourceMapHighlightReturn {
  readonly funcHighlightGroups: readonly HighlightGroup[]
  readonly asmHighlightGroups: readonly HighlightGroup[]
  readonly funcHoveredLines: readonly number[]
  readonly asmHoveredLines: readonly number[]
  readonly handleFuncLineHover: (line: number | null) => void
  readonly handleAsmLineHover: (line: number | null) => void
  readonly filteredAsmCode: string
}

/**
 * Filters out DEBUGMARK instructions from assembly code and creates line mapping
 */
function filterDebugMarks(asmCode: string): {
  filteredCode: string
  originalToFiltered: Map<number, number>
  filteredToOriginal: Map<number, number>
} {
  console.log("filterDebugMarks called with code length:", asmCode.length)
  console.log("First 200 chars:", asmCode.substring(0, 200))

  const lines = asmCode.split("\n")
  const filteredLines: string[] = []
  const originalToFiltered = new Map<number, number>()
  const filteredToOriginal = new Map<number, number>()

  let filteredLineNumber = 1
  let debugMarkCount = 0

  for (let i = 0; i < lines.length; i++) {
    const originalLineNumber = i + 1
    const line = lines[i].trim()

    // Skip DEBUGMARK lines
    if (line.startsWith("DEBUGMARK ")) {
      debugMarkCount++
      continue
    }

    // Keep non-DEBUGMARK lines
    filteredLines.push(lines[i])
    originalToFiltered.set(originalLineNumber, filteredLineNumber)
    filteredToOriginal.set(filteredLineNumber, originalLineNumber)
    filteredLineNumber++
  }

  const result = {
    filteredCode: filteredLines.join("\n"),
    originalToFiltered,
    filteredToOriginal,
  }

  console.log("Filtered out", debugMarkCount, "DEBUGMARK lines")
  console.log("Original lines:", lines.length, "Filtered lines:", filteredLines.length)
  console.log("Filtered code length:", result.filteredCode.length)

  return result
}

const COLORS = [
  "#FF6B6B", // Red
  "#4ECDC4", // Teal
  "#45B7D1", // Blue
  "#96CEB4", // Green
  "#FFEAA7", // Yellow
  "#DDA0DD", // Plum
  "#98D8C8", // Mint
  "#F7DC6F", // Gold
  "#BB8FCE", // Purple
  "#85C1E9", // Sky Blue
]

export function useSourceMapHighlight(
  sourceMap: FuncMapping | undefined,
  debugSectionToInstructions?: Map<number, trace.InstructionInfo[]>,
  funcEditorRef?: React.RefObject<monaco.editor.IStandaloneCodeEditor | null>,
  asmEditorRef?: React.RefObject<monaco.editor.IStandaloneCodeEditor | null>,
  originalAsmCode?: string,
): UseSourceMapHighlightReturn {
  const [hoveredFuncLine, setHoveredFuncLine] = useState<number | null>(null)
  const [hoveredAsmLine, setHoveredAsmLine] = useState<number | null>(null)

  // Filter DEBUGMARK instructions and create line mappings
  const {filteredAsmCode, originalToFiltered} = useMemo(() => {
    if (!originalAsmCode) {
      return {
        filteredAsmCode: "",
        originalToFiltered: new Map<number, number>(),
      }
    }
    const result = filterDebugMarks(originalAsmCode)
    return {
      filteredAsmCode: result.filteredCode,
      originalToFiltered: result.originalToFiltered,
    }
  }, [originalAsmCode])

  // Create line mappings from source map and debug sections
  const {funcToAsmMap, asmToFuncMap} = useMemo(() => {
    if (!sourceMap || !debugSectionToInstructions) {
      return {funcToAsmMap: new Map<number, number[]>(), asmToFuncMap: new Map<number, number[]>()}
    }

    const funcToAsm = new Map<number, number[]>()
    const asmToFunc = new Map<number, number[]>()

    // Iterate through source map locations (debugId is the index)
    sourceMap.locations.forEach((location, debugId) => {
      const funcLine = location.line

      // Get instructions for this debugId
      const instructions = debugSectionToInstructions.get(debugId)
      if (!instructions || instructions.length === 0) {
        return
      }

      // Extract assembly line numbers from instructions and convert to filtered line numbers
      const asmLineNumbers: number[] = []
      for (const instr of instructions) {
        // Check if instruction has location information
        if (instr.loc && instr.loc.line !== undefined) {
          const originalAsmLine = instr.loc.line + 1 // Convert to 1-based indexing
          const filteredAsmLine = originalToFiltered.get(originalAsmLine)
          if (filteredAsmLine) {
            asmLineNumbers.push(filteredAsmLine)
          }
        }
      }

      if (asmLineNumbers.length === 0) {
        return
      }

      // Map FunC line to assembly lines
      if (!funcToAsm.has(funcLine)) {
        funcToAsm.set(funcLine, [])
      }
      funcToAsm.get(funcLine)?.push(...asmLineNumbers)

      // Map assembly lines to FunC line
      asmLineNumbers.forEach(asmLine => {
        if (!asmToFunc.has(asmLine)) {
          asmToFunc.set(asmLine, [])
        }
        asmToFunc.get(asmLine)?.push(funcLine)
      })
    })

    return {funcToAsmMap: funcToAsm, asmToFuncMap: asmToFunc}
  }, [sourceMap, debugSectionToInstructions, originalToFiltered])

  // Create highlight groups for source map visualization
  const {funcHighlightGroups, asmHighlightGroups} = useMemo(() => {
    const funcGroups: HighlightGroup[] = []
    const asmGroups: HighlightGroup[] = []

    let colorIndex = 0
    funcToAsmMap.forEach((asmLines, funcLine) => {
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
    })

    return {funcHighlightGroups: funcGroups, asmHighlightGroups: asmGroups}
  }, [funcToAsmMap])

  // Handle hover events with auto-scroll
  const handleFuncLineHover = useCallback(
    (line: number | null) => {
      setHoveredFuncLine(line)

      // Auto-scroll assembly editor to corresponding lines
      if (line && funcToAsmMap.has(line) && asmEditorRef?.current) {
        const correspondingLines = funcToAsmMap.get(line)
        if (correspondingLines && correspondingLines?.length > 0) {
          // Scroll to the first corresponding line
          const targetLine = correspondingLines[0]
          // Use revealLineInCenterIfOutsideViewport to avoid unnecessary scrolling
          asmEditorRef.current.revealLineInCenterIfOutsideViewport(targetLine)
        }
      }
    },
    [funcToAsmMap, asmEditorRef],
  )

  const handleAsmLineHover = useCallback(
    (line: number | null) => {
      setHoveredAsmLine(line)

      // Auto-scroll FunC editor to corresponding lines
      if (line && asmToFuncMap.has(line) && funcEditorRef?.current) {
        const correspondingLines = asmToFuncMap.get(line)
        if (correspondingLines && correspondingLines?.length > 0) {
          // Scroll to the first corresponding line
          const targetLine = correspondingLines[0]
          // Use revealLineInCenterIfOutsideViewport to avoid unnecessary scrolling
          funcEditorRef.current.revealLineInCenterIfOutsideViewport(targetLine)
        }
      }
    },
    [asmToFuncMap, funcEditorRef],
  )

  // Calculate hovered lines for cross-highlighting
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

  return {
    funcHighlightGroups,
    asmHighlightGroups,
    funcHoveredLines,
    asmHoveredLines,
    handleFuncLineHover,
    handleAsmLineHover,
    filteredAsmCode,
  }
}
