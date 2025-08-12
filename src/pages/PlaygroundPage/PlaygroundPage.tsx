import React, {Suspense, useCallback, useEffect, useMemo, useRef, useState} from "react"
import type {StackElement} from "ton-assembly/dist/trace"
import type * as monaco from "monaco-editor"
import {trace} from "ton-assembly"

import InlineLoader from "@shared/ui/InlineLoader"
import TraceSidePanel from "@shared/ui/TraceSidePanel"

import {type AssemblyExecutionResult, executeAssemblyCode} from "@features/tasm/lib/executor.ts"
import StatusBadge, {type StatusType} from "@shared/ui/StatusBadge"
import {useLineExecutionData, useTraceStepper, useFuncLineStepper} from "@features/txTrace/hooks"
import {normalizeGas} from "@features/txTrace/lib/traceTx"
import type {InstructionDetail} from "@features/txTrace/ui/StepInstructionBlock"
import {useFuncCompilation, useSourceMapHighlight} from "@app/pages/GodboltPage/hooks"

import PageHeader from "@shared/ui/PageHeader"
import Tutorial, {useTutorial} from "@shared/ui/Tutorial"

import ShareButton from "@shared/ui/ShareButton/ShareButton.tsx"
import {decodeCodeFromUrl} from "@app/pages/GodboltPage/urlCodeSharing.ts"

import {ExecuteButton} from "@app/pages/PlaygroundPage/components/ExecuteButton.tsx"
import {CustomSegmentedSelector} from "@app/pages/GodboltPage/components"

import {TUTORIAL_STEPS} from "@app/pages/PlaygroundPage/Tutorial.ts"

import {useGlobalError} from "@shared/lib/useGlobalError.tsx"

import styles from "./PlaygroundPage.module.css"

const CodeEditor = React.lazy(() => import("@shared/ui/CodeEditor"))

const DEFAULT_ASSEMBLY_CODE = `PUSHINT_8 42
PUSHINT_8 100
ADD
PUSHINT_16 200
SUB

NOP
`

const DEFAULT_FUNC_CODE = `#include "stdlib.fc";

() recv_internal(int msg_value, cell in_msg_cell, slice in_msg) impure {
    var cs = in_msg_cell.begin_parse();
    var flags = cs~load_int(4);
    throw(flags);
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
    return (localStorage.getItem(LOCAL_STORAGE_KEY_MODE) as LanguageMode) ?? "tasm"
  })

  const [steppingMode, setSteppingMode] = useState<SteppingMode>(() => {
    return (localStorage.getItem(LOCAL_STORAGE_KEY_STEPPING) as SteppingMode) ?? "instructions"
  })

  const [assemblyCode, setAssemblyCode] = useState(() => {
    if (languageMode === "tasm") {
      const sharedCode = decodeCodeFromUrl()
      if (sharedCode) {
        return sharedCode
      }
    }
    return localStorage.getItem(LOCAL_STORAGE_KEY_ASM) ?? DEFAULT_ASSEMBLY_CODE
  })

  const [funcCode, setFuncCode] = useState(() => {
    if (languageMode === "func") {
      const sharedCode = decodeCodeFromUrl()
      if (sharedCode) {
        return sharedCode
      }
    }
    return localStorage.getItem(LOCAL_STORAGE_KEY_FUNC) ?? DEFAULT_FUNC_CODE
  })

  const [result, setResult] = useState<AssemblyExecutionResult | undefined>(undefined)
  const [loading, setLoading] = useState(false)
  const [initialStack, setInitialStack] = useState<StackElement[]>(() => {
    try {
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

  const funcEditorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)

  const {
    result: compilationResult,
    compiling: compilationLoading,
    error: compilationError,
    handleCompile: handleCompileFuncCode,
    clearError: clearCompilationError,
  } = useFuncCompilation()

  const sourceMap = useMemo(() => {
    if (compilationResult?.funcSourceMap) {
      try {
        return trace.loadFuncMapping(compilationResult.funcSourceMap)
      } catch (e) {
        console.error("Failed to parse source map:", e as Error)
        return undefined
      }
    }
    return undefined
  }, [compilationResult?.funcSourceMap])

  const {funcPreciseHighlightRanges, handleAsmLineHover} = useSourceMapHighlight(
    sourceMap,
    compilationResult?.mapping,
    funcEditorRef,
    undefined,
  )

  const traceInfo = result?.traceInfo
  console.log(traceInfo)

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
  } = useFuncLineStepper(baseStepperReturn, {
    sourceMap,
    compilationResult,
    traceInfo,
    isEnabled: isLineStepping,
  })

  const lineExecutionData = useLineExecutionData(traceInfo)

  // Handle highlighting for FunC mode based on current step
  const [funcHighlightLine, setFuncHighlightLine] = useState<number | undefined>(undefined)

  useEffect(() => {
    if (languageMode === "func" && traceInfo && selectedStep > 0) {
      const stepIndex = selectedStep
      if (stepIndex >= 0 && stepIndex < traceInfo.steps.length) {
        const step = traceInfo.steps[stepIndex]
        console.log(`Step ${selectedStep}: step.loc?.line=${step.loc?.line}`)

        // Find corresponding instruction and use its debugSection to find source location
        if (step?.loc?.line !== undefined && sourceMap && compilationResult?.mapping) {
          const asmLine = step.loc.line + 1
          let foundLocation = false

          // Find instruction that matches the assembly line
          for (const [debugSection, instructions] of compilationResult.mapping.entries()) {
            for (const instr of instructions) {
              if (instr.loc?.line !== undefined && instr.loc.line + 1 === asmLine) {
                // Found matching instruction, now find corresponding source location
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

        // Handle precise highlighting based on assembly line
        if (step.loc?.line !== undefined) {
          const asmLine = step.loc.line + 1
          handleAsmLineHover(asmLine)
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
    compilationResult?.mapping,
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

  // Execute compiled FunC code when compilation completes
  useEffect(() => {
    if (languageMode === "func" && compilationResult?.assembly && loading && !compilationLoading) {
      const executeCompiledCode = async () => {
        try {
          const result = await executeAssemblyCode(compilationResult.assembly, initialStack)
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
    }
  }, [
    languageMode,
    compilationResult?.assembly,
    loading,
    compilationLoading,
    setError,
    initialStack,
  ])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault()
        if (!loading && !compilationLoading) {
          void handleExecute()
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [handleExecute, loading, compilationLoading])

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

  const implicitRet = (() => {
    const steps = result?.traceInfo?.steps
    if (!steps) return {line: undefined as number | undefined, approx: false}
    const current = steps[selectedStep]
    if (!current || current.loc !== undefined)
      return {line: undefined as number | undefined, approx: false}

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
  const displayError = compilationError || (languageMode === "tasm" ? undefined : undefined)

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
          <div className={styles.mainActionContainer} role="toolbar" aria-label="Code actions">
            <ExecuteButton
              onClick={() => void handleExecute()}
              loading={loading || compilationLoading}
            />
            <ShareButton value={currentCode} />
          </div>
        </div>
      </PageHeader>

      {displayError && (
        <div className={styles.errorContainer}>
          <div className={styles.errorMessage}>{displayError}</div>
        </div>
      )}

      <div id="execution-status" className="sr-only" aria-live="polite" aria-atomic="true">
        {(loading || compilationLoading) &&
          `${languageMode === "func" ? "Compiling and executing" : "Executing"} code...`}
        {result && !loading && !compilationLoading && "Code executed successfully"}
        {result?.exitCode &&
          result.exitCode.num !== 0 &&
          !loading &&
          !compilationLoading &&
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
              <CodeEditor
                code={currentCode}
                onChange={handleCodeChange}
                readOnly={false}
                highlightLine={languageMode === "tasm" ? highlightLine : funcHighlightLine}
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
                onEditorMount={editor => {
                  if (languageMode === "func") {
                    funcEditorRef.current = editor
                  }
                }}
              />
            </Suspense>
          </div>
          <TraceSidePanel
            selectedStep={selectedStep}
            totalSteps={totalSteps}
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
