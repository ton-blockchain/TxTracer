import {Suspense, useCallback, useEffect, useMemo, useRef, useState, lazy} from "react"
import type {StackElement} from "ton-assembly/dist/trace"
import type * as monaco from "monaco-editor"
import {logs} from "ton-assembly"

import InlineLoader from "@shared/ui/InlineLoader"
import TraceSidePanel from "@shared/ui/TraceSidePanel"

import {type AssemblyExecutionResult, executeAssemblyCode} from "@features/tasm/lib/executor.ts"
import StatusBadge, {type StatusType} from "@shared/ui/StatusBadge"
import {useLineExecutionData, useTraceStepper, useFuncLineStepper} from "@features/txTrace/hooks"
import {normalizeGas} from "@features/txTrace/lib/traceTx"
import type {InstructionDetail} from "@features/txTrace/ui/StepInstructionBlock"
import {useFuncCompilation, useSourceMapHighlight} from "@app/pages/GodboltPage/hooks"
import {CompilerErrors, CustomSegmentedSelector} from "@app/pages/GodboltPage/components"

import PageHeader from "@shared/ui/PageHeader"
import Tutorial, {useTutorial} from "@shared/ui/Tutorial"

import {ShareButton} from "@shared/ui/ShareButton/ShareButton.tsx"
import SettingsDropdown from "@shared/ui/SettingsDropdown/SettingsDropdown.tsx"
import {usePlaygroundSettings} from "@app/pages/PlaygroundPage/hooks/usePlaygroundSettings.ts"
import {
  clearShareHash,
  decodeCodeFromUrl,
  decodeLanguageFromUrl,
  decodeStackFromUrl,
} from "@app/pages/GodboltPage/urlCodeSharing.ts"

import {ExecuteButton} from "@app/pages/PlaygroundPage/components/ExecuteButton.tsx"

import {TUTORIAL_STEPS} from "@app/pages/PlaygroundPage/Tutorial.ts"

import {useGlobalError} from "@shared/lib/useGlobalError.tsx"

import styles from "./PlaygroundPage.module.css"

const CodeEditor = lazy(() => import("@shared/ui/CodeEditor"))

const DEFAULT_ASSEMBLY_CODE = `PUSHINT_8 42
PUSHINT_8 100
ADD
PUSHINT_16 200
SUB

NOP
`

const DEFAULT_FUNC_CODE = `#include "stdlib.fc";

;; Add two values to stack first! For example: 10 and 20
() recv_internal(int a, int b) impure {
    if (a > b) {
        throw(10);
    }

    ;; create some data
    var data = begin_cell()
        .store_int(1, 32)
        .end_cell();

    if (a == b) {
        var c = a + b;
        throw(20 + c);
    }

    throw(data.cell_hash() % 10);
}
`

type LanguageMode = "func" | "tasm"
type SteppingMode = "instructions" | "lines"

const LOCAL_STORAGE_KEY_ASM = "txtracer-playground-assembly-code"
const LOCAL_STORAGE_KEY_FUNC = "txtracer-playground-func-code"
const LOCAL_STORAGE_KEY_MODE = "txtracer-playground-language-mode"
const LOCAL_STORAGE_KEY_STEPPING = "txtracer-playground-stepping-mode"
const INITIAL_STACK_STORAGE_KEY = "txtracer-playground-initial-stack"

function PlaygroundPage() {
  const [languageMode, setLanguageMode] = useState<LanguageMode>(() => {
    const fromUrl = decodeLanguageFromUrl()
    if (fromUrl === "func" || fromUrl === "tasm") return fromUrl
    return (localStorage.getItem(LOCAL_STORAGE_KEY_MODE) as LanguageMode) ?? "tasm"
  })

  const [steppingMode, setSteppingMode] = useState<SteppingMode>(() => {
    return (localStorage.getItem(LOCAL_STORAGE_KEY_STEPPING) as SteppingMode) ?? "instructions"
  })

  const [assemblyCode, setAssemblyCode] = useState(() => {
    const fromUrl = decodeLanguageFromUrl()
    if (fromUrl === "tasm") {
      const sharedCode = decodeCodeFromUrl()
      if (sharedCode) {
        clearShareHash()
        return sharedCode
      }
    }
    return localStorage.getItem(LOCAL_STORAGE_KEY_ASM) ?? DEFAULT_ASSEMBLY_CODE
  })

  const [funcCode, setFuncCode] = useState(() => {
    const fromUrl = decodeLanguageFromUrl()
    if (fromUrl === "func") {
      const sharedCode = decodeCodeFromUrl()
      if (sharedCode) {
        clearShareHash()
        return sharedCode
      }
    }
    return localStorage.getItem(LOCAL_STORAGE_KEY_FUNC) ?? DEFAULT_FUNC_CODE
  })

  const [result, setResult] = useState<AssemblyExecutionResult | undefined>(undefined)
  const [loading, setLoading] = useState(false)
  const [initialStack, setInitialStack] = useState<StackElement[]>(() => {
    try {
      const fromUrl = decodeStackFromUrl()
      if (fromUrl) {
        const parsedStack = logs.parseStack(fromUrl)
        if (parsedStack) {
          return logs.processStack(parsedStack)
        }
      }
      const saved = localStorage.getItem(INITIAL_STACK_STORAGE_KEY)
      if (!saved) return []

      return JSON.parse(saved, (key, value) => {
        if (key === "value" && typeof value === "string" && value.match(/^-?\d+$/)) {
          try {
            return BigInt(value)
          } catch {
            return value
          }
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return value
      }) as StackElement[]
    } catch (error) {
      localStorage.removeItem(INITIAL_STACK_STORAGE_KEY)
      console.warn("Failed to restore initial stack from localStorage:", error)
      return []
    }
  })

  const {setError, clearError} = useGlobalError()

  const tutorial = useTutorial({tutorialKey: "playground-page", autoStart: true})
  const settings = usePlaygroundSettings()

  const funcEditorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
  const asmViewerRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)

  const {
    result: funcResult,
    compiling: funcCompiling,
    errorMarkers: funcMarkers,
    handleCompile: handleCompileFuncCode,
    clearError: clearCompilationError,
  } = useFuncCompilation()

  const sourceMap = funcResult?.sourceMap

  const {
    funcHighlightGroups,
    asmHighlightGroups,
    asmHoveredLines,
    funcPreciseHighlightRanges,
    handleAsmLineHover,
    filteredAsmCode,
    mapOriginalAsmToFiltered,
  } = useSourceMapHighlight(
    sourceMap,
    funcResult?.mapping,
    funcEditorRef,
    asmViewerRef,
    funcResult?.assembly,
  )

  const traceInfo = result?.traceInfo
  const baseStepperReturn = useTraceStepper(traceInfo)
  const isLineStepping = languageMode === "func" && steppingMode === "lines"

  const {
    selectedStep,
    currentStep,
    currentStack,
    totalSteps,
    canGoPrev,
    canGoNext,
    handlePrev,
    handleNext,
    goToFirstStep,
    goToLastStep,
    findStepByLine,
    highlightLine,
    transitionType,
    handlePrevFunc,
    handleNextFunc,
    currentFuncStepIndex,
    funcSteps,
  } = useFuncLineStepper(baseStepperReturn, {
    sourceMap,
    compilationResult: funcResult,
    traceInfo,
    isEnabled: isLineStepping,
  })

  const lineExecutionData = useLineExecutionData(traceInfo)

  const filteredAsmLineExecutionData = useMemo(() => {
    if (!filteredAsmCode || !settings.dimNeverExecutedLines) return undefined
    const remapped: Record<number, {gas?: number; executions?: number}> = {}
    for (const [key, data] of Object.entries(lineExecutionData)) {
      const originalLine = Number(key)
      const mapped = mapOriginalAsmToFiltered(originalLine)
      if (mapped === undefined) continue
      const prev = remapped[mapped] ?? {}
      remapped[mapped] = {
        gas: (prev.gas ?? 0) + (data.gas ?? 0),
        executions: (prev.executions ?? 0) + (data.executions ?? 0),
      }
    }
    return remapped
  }, [filteredAsmCode, lineExecutionData, mapOriginalAsmToFiltered, settings.dimNeverExecutedLines])

  const [funcHighlightLine, setFuncHighlightLine] = useState<number | undefined>(undefined)
  const currentAsmLine = useMemo(() => {
    if (languageMode !== "func") return undefined
    const step = traceInfo?.steps?.[selectedStep]
    if (step?.loc?.line !== undefined) {
      const original = step.loc.line + 1
      const mapped = mapOriginalAsmToFiltered(original)
      return mapped ?? undefined
    }
    return undefined
  }, [languageMode, traceInfo, selectedStep, mapOriginalAsmToFiltered])

  useEffect(() => {
    if (languageMode === "func" && traceInfo && selectedStep > 0) {
      const stepIndex = selectedStep
      if (stepIndex >= 0 && stepIndex < traceInfo.steps.length) {
        const step = traceInfo.steps[stepIndex]
        console.log(`Step ${selectedStep}: step.loc.line=${step.loc?.line}`)

        if (step?.loc?.line !== undefined && sourceMap && funcResult?.mapping) {
          const asmLine = step.loc.line + 1
          let foundLocation = false

          for (const [debugSection, instructions] of funcResult.mapping.entries()) {
            for (const instr of instructions) {
              if (instr.loc?.line !== undefined && instr.loc.line + 1 === asmLine) {
                for (const [debugId, location] of sourceMap.locations.entries()) {
                  if (debugId === debugSection && location.file === "main.fc") {
                    console.log(
                      `Found FunC location: line=${location.line}, pos=${location.pos}, length=${location.length}`,
                    )
                    setFuncHighlightLine(location.line)
                    foundLocation = true
                    break
                  }
                }
                if (foundLocation) break
              }
            }
            if (foundLocation) break
          }

          if (!foundLocation) {
            console.log(`No FunC location found for assembly line ${asmLine}`)
            setFuncHighlightLine(undefined)
          }
        } else {
          setFuncHighlightLine(undefined)
        }

        if (step.loc?.line !== undefined) {
          const originalAsmLine = step.loc.line + 1
          const filteredAsmLine = mapOriginalAsmToFiltered(originalAsmLine)
          handleAsmLineHover(filteredAsmLine ?? null)
        } else {
          handleAsmLineHover(null)
        }
      } else {
        setFuncHighlightLine(undefined)
        handleAsmLineHover(null)
      }
    } else {
      handleAsmLineHover(null)
      setFuncHighlightLine(undefined)
    }
  }, [
    selectedStep,
    traceInfo,
    languageMode,
    handleAsmLineHover,
    sourceMap,
    funcResult?.mapping,
    mapOriginalAsmToFiltered,
  ])

  const instructionDetails: InstructionDetail[] = useMemo(() => {
    if (!traceInfo) return []
    return traceInfo.steps.map(step => ({
      name: step.instructionName,
      gasCost: normalizeGas(step),
    }))
  }, [traceInfo])

  const cumulativeGas = useMemo(() => {
    if (!traceInfo) return 0
    let totalGas = 0
    for (let i = 0; i < selectedStep; i++) {
      const step = traceInfo.steps[i]
      if (step) {
        totalGas += normalizeGas(step)
      }
    }
    return totalGas
  }, [traceInfo, selectedStep])

  const handleExecute = useCallback(async () => {
    if (languageMode === "func") {
      if (!funcCode.trim()) {
        return
      }

      setLoading(true)
      clearError()
      clearCompilationError()

      try {
        await handleCompileFuncCode(funcCode)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error"
        setError(`Failed to compile FunC code: ${errorMessage}`)
        setLoading(false)
      }
    } else {
      if (!assemblyCode.trim()) {
        return
      }

      setLoading(true)
      clearError()

      try {
        const result = await executeAssemblyCode(assemblyCode, initialStack)
        setResult(result)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error"
        setError(`Failed to execute assembly code: ${errorMessage}`)
        setResult(undefined)
      } finally {
        setLoading(false)
      }
    }
  }, [
    languageMode,
    funcCode,
    assemblyCode,
    initialStack,
    clearError,
    clearCompilationError,
    handleCompileFuncCode,
    setError,
  ])

  useEffect(() => {
    if (languageMode !== "func" || !loading || funcCompiling) return

    const assembly = funcResult?.assembly
    if (assembly) {
      const executeCompiledCode = async () => {
        try {
          const result = await executeAssemblyCode(assembly, initialStack)
          setResult(result)
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error"
          setError(`Failed to execute compiled code: ${errorMessage}`)
          setResult(undefined)
        } finally {
          setLoading(false)
        }
      }
      void executeCompiledCode()
      return
    }

    setLoading(false)
  }, [languageMode, loading, funcCompiling, funcResult?.assembly, setError, initialStack])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault()
        if (!loading && !funcCompiling) {
          void handleExecute()
        }
        return
      }
      if (languageMode === "func" && isLineStepping) {
        if (event.key === "ArrowLeft") {
          event.preventDefault()
          handlePrevFunc?.()
          return
        }
        if (event.key === "ArrowRight") {
          event.preventDefault()
          handleNextFunc?.()
          return
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [
    handleExecute,
    loading,
    funcCompiling,
    languageMode,
    isLineStepping,
    handlePrevFunc,
    handleNextFunc,
  ])

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_ASM, assemblyCode)
  }, [assemblyCode])

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_FUNC, funcCode)
  }, [funcCode])

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_MODE, languageMode)
  }, [languageMode])

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_STEPPING, steppingMode)
  }, [steppingMode])

  useEffect(() => {
    try {
      localStorage.setItem(
        INITIAL_STACK_STORAGE_KEY,
        JSON.stringify(initialStack, (_, value) => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
          return typeof value === "bigint" ? value.toString() : value
        }),
      )
    } catch (error) {
      console.warn("Failed to save initial stack to localStorage:", error)
    }
  }, [initialStack])

  const handleCodeChange = useCallback(
    (newCode: string) => {
      if (languageMode === "func") {
        setFuncCode(newCode)
      } else {
        setAssemblyCode(newCode)
      }
      setResult(undefined)
      clearError()
      clearCompilationError()
    },
    [languageMode, clearError, clearCompilationError],
  )

  const handleStackChange = useCallback((newStack: StackElement[]) => {
    setInitialStack(newStack)
    setResult(undefined)
  }, [])

  const handleLanguageModeChange = useCallback(
    (newMode: LanguageMode) => {
      setLanguageMode(newMode)
      setResult(undefined)
      clearError()
      clearCompilationError()
    },
    [clearError, clearCompilationError],
  )

  const handleSteppingModeChange = useCallback((newMode: SteppingMode) => {
    setSteppingMode(newMode)
  }, [])

  const implicitRet: {line: number | undefined; approx: boolean} = (() => {
    const steps = result?.traceInfo?.steps
    if (!steps) {
      return {line: undefined, approx: false}
    }
    const current = steps[selectedStep]
    if (!current || current.loc !== undefined) {
      return {line: undefined, approx: false}
    }

    let idx = selectedStep - 1
    let chainLen = 1
    while (idx >= 0 && steps[idx]?.loc === undefined) {
      chainLen++
      idx--
    }
    const anchor = idx >= 0 ? steps[idx] : undefined
    const line = anchor?.loc?.line !== undefined ? anchor.loc.line + 1 : undefined
    const approx = chainLen > 1
    return {line, approx}
  })()

  const implicitRetAsmLine = useMemo(() => {
    if (implicitRet.line === undefined) return undefined
    return mapOriginalAsmToFiltered(implicitRet.line)
  }, [implicitRet.line, mapOriginalAsmToFiltered])

  const funcGasByLine = useMemo(() => {
    const map = new Map<number, number>()
    if (!traceInfo || !sourceMap || !funcResult?.mapping) return map

    for (const step of traceInfo.steps ?? []) {
      if (step?.loc?.line === undefined) continue
      const asmLine = step.loc.line + 1

      for (const [debugSection, instructions] of funcResult.mapping.entries()) {
        for (const instr of instructions) {
          if (instr.loc?.line !== undefined && instr.loc.line + 1 === asmLine) {
            const location = sourceMap.locations[debugSection]
            if (location && location.file === "main.fc") {
              const funcLine = location.line
              const prev = map.get(funcLine) ?? 0
              map.set(funcLine, prev + normalizeGas(step))
              break
            }
          }
        }
      }
    }

    return map
  }, [traceInfo, sourceMap, funcResult?.mapping])

  const txStatus: StatusType | undefined = useMemo(() => {
    if (!result) return undefined

    if (result.exitCode && result.exitCode.num !== 0) {
      return "failed"
    }
    return "success"
  }, [result])

  const shouldShowStatusContainer = txStatus !== undefined
  const txStatusText = `Exit code: ${result?.exitCode?.num ?? 0}`
  const currentCode = languageMode === "func" ? funcCode : assemblyCode

  const stackToShare = useMemo(() => logs.serializeStack(initialStack), [initialStack])

  return (
    <div className={styles.traceViewWrapper}>
      <PageHeader pageTitle="playground">
        {shouldShowStatusContainer && (
          <div className={styles.txStatusContainer} role="status" aria-live="polite">
            {txStatus && (
              <StatusBadge type={txStatus} text={txStatusText} exitCode={result?.exitCode?.num} />
            )}
          </div>
        )}
        <div className={styles.headerContent}>
          <div className={styles.languageSwitcherContainer}>
            <div className={styles.languageSwitcher}>
              <CustomSegmentedSelector
                options={[
                  {value: "tasm", label: "Assembly"},
                  {value: "func", label: "FunC", badge: "beta"},
                ]}
                value={languageMode}
                onChange={val => handleLanguageModeChange(val as "func" | "tasm")}
                ariaLabel="Select Playground language"
              />
            </div>
            {languageMode === "func" && (
              <div className={styles.steppingSwitcher}>
                <span className={styles.steppingLabel}>Stepping mode:</span>
                <CustomSegmentedSelector
                  options={[
                    {value: "instructions", label: "Instructions"},
                    {value: "lines", label: "Source Lines"},
                  ]}
                  value={steppingMode}
                  onChange={val => handleSteppingModeChange(val as "instructions" | "lines")}
                  ariaLabel="Select stepping mode"
                />
              </div>
            )}
          </div>
          <div className={styles.mainActionContainer} role="toolbar" aria-label="Code actions">
            <ExecuteButton
              onClick={() => void handleExecute()}
              loading={loading || funcCompiling}
            />
            <ShareButton value={currentCode} lang={languageMode} stack={stackToShare} />
            <SettingsDropdown
              items={[
                {
                  id: "mapping",
                  label: "Show color mapping",
                  checked: settings.showMappingHighlight && !isLineStepping,
                  onToggle: settings.toggleShowMappingHighlight,
                },
                {
                  id: "dim-never-executed",
                  label: "Dim never executed lines",
                  checked: settings.dimNeverExecutedLines,
                  onToggle: settings.toggleDimNeverExecutedLines,
                },
              ]}
            />
          </div>
        </div>
      </PageHeader>

      <div id="execution-status" className="sr-only" aria-live="polite" aria-atomic="true">
        {(loading || funcCompiling) &&
          `${languageMode === "func" ? "Compiling and executing" : "Executing"} code...`}
        {result && !loading && !funcCompiling && "Code executed successfully"}
        {result?.exitCode &&
          result.exitCode.num !== 0 &&
          !loading &&
          !funcCompiling &&
          `Execution completed with exit code ${result.exitCode.num}`}
      </div>

      <div className="sr-only">
        Press Ctrl+Enter or Cmd+Enter to{" "}
        {languageMode === "func" ? "compile and execute" : "execute"} the code
      </div>

      <main className={styles.appContainer} role="main" aria-label="Code playground">
        <div className={styles.mainContent}>
          <div className={styles.editorContainer}>
            <h2 id="code-editor-heading" className="sr-only">
              {languageMode === "func" ? "FunC" : "Assembly"} Code Editor
            </h2>
            <Suspense fallback={<InlineLoader message="Loading Editor..." loading={true} />}>
              <div
                className={
                  languageMode === "func" && steppingMode === "instructions" && funcResult?.assembly
                    ? styles.funcEditorWrapper
                    : styles.fullEditorWrapper
                }
              >
                <CodeEditor
                  code={currentCode}
                  onChange={handleCodeChange}
                  readOnly={false}
                  modelPath={languageMode === "func" ? "playground-func.fc" : "playground-asm.tasm"}
                  markers={languageMode === "func" ? funcMarkers : []}
                  highlightLine={languageMode === "tasm" ? highlightLine : funcHighlightLine}
                  highlightGroups={
                    languageMode === "func" && settings.showMappingHighlight && !isLineStepping
                      ? funcHighlightGroups
                      : undefined
                  }
                  highlightRanges={
                    languageMode === "func" && steppingMode === "instructions"
                      ? funcPreciseHighlightRanges
                      : undefined
                  }
                  lineExecutionData={languageMode === "tasm" ? lineExecutionData : undefined}
                  implicitRetLine={implicitRet.line}
                  implicitRetLabel={
                    implicitRet.approx ? "↵ implicit RET (approximate position)" : undefined
                  }
                  shouldCenter={transitionType === "button"}
                  exitCode={result?.exitCode}
                  onLineClick={languageMode === "tasm" ? findStepByLine : undefined}
                  language={languageMode}
                  funcGasByLine={languageMode === "func" ? funcGasByLine : undefined}
                  onEditorMount={editor => {
                    if (languageMode === "func") {
                      funcEditorRef.current = editor
                    }
                  }}
                />
                {languageMode === "func" &&
                  steppingMode === "instructions" &&
                  funcResult?.assembly && (
                    <div className={styles.asmViewerWrapper}>
                      <CodeEditor
                        code={filteredAsmCode ?? funcResult.assembly}
                        readOnly={true}
                        language="tasm"
                        modelPath="playground-func-output.tasm"
                        needFloatingTip={false}
                        highlightLine={currentAsmLine}
                        lineExecutionData={filteredAsmLineExecutionData}
                        highlightGroups={
                          settings.showMappingHighlight && !isLineStepping
                            ? asmHighlightGroups
                            : undefined
                        }
                        hoveredLines={
                          settings.showMappingHighlight && !isLineStepping
                            ? asmHoveredLines
                            : undefined
                        }
                        onLineHover={
                          settings.showMappingHighlight && !isLineStepping
                            ? handleAsmLineHover
                            : undefined
                        }
                        implicitRetLine={implicitRetAsmLine}
                        implicitRetLabel={
                          implicitRet.approx ? "↵ implicit RET (approximate position)" : undefined
                        }
                        shouldCenter={true}
                        onEditorMount={editor => {
                          asmViewerRef.current = editor
                        }}
                      />
                    </div>
                  )}
              </div>
              {languageMode === "func" && (
                <CompilerErrors
                  markers={funcMarkers}
                  filename="main.fc"
                  onNavigate={(line, column) => {
                    const editor = funcEditorRef.current
                    if (!editor) return
                    editor.revealPositionInCenter({lineNumber: line, column})
                    editor.setPosition({lineNumber: line, column})
                    editor.focus()
                  }}
                />
              )}
            </Suspense>
          </div>
          <TraceSidePanel
            selectedStep={
              isLineStepping && currentFuncStepIndex !== undefined
                ? currentFuncStepIndex
                : selectedStep
            }
            totalSteps={isLineStepping ? funcSteps.length : totalSteps}
            currentStep={currentStep}
            currentStack={currentStack}
            canGoPrev={canGoPrev}
            canGoNext={canGoNext}
            onPrev={handlePrev}
            onNext={handleNext}
            onFirst={goToFirstStep}
            onLast={goToLastStep}
            placeholderMessage="Ready to execute"
            instructionDetails={instructionDetails}
            cumulativeGas={cumulativeGas}
            showGas={true}
            showStackSetup={true}
            initialStack={initialStack}
            onInitialStackChange={handleStackChange}
            hasExecutionResults={!!result}
            className={styles.sidebarArea}
          />
        </div>
      </main>

      <Tutorial
        steps={TUTORIAL_STEPS}
        isOpen={tutorial.isOpen}
        onClose={tutorial.closeTutorial}
        onComplete={tutorial.completeTutorial}
      />
    </div>
  )
}

export default PlaygroundPage
