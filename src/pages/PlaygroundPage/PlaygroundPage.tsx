import {Suspense, useCallback, useEffect, useMemo, useState, lazy} from "react"
import type {StackElement} from "ton-assembly/dist/trace"

import InlineLoader from "@shared/ui/InlineLoader"
import TraceSidePanel from "@shared/ui/TraceSidePanel"

import {type AssemblyExecutionResult, executeAssemblyCode} from "@features/tasm/lib/executor.ts"
import StatusBadge, {type StatusType} from "@shared/ui/StatusBadge"
import {useLineExecutionData, useTraceStepper} from "@features/txTrace/hooks"
import {normalizeGas} from "@features/txTrace/lib/traceTx"
import type {InstructionDetail} from "@features/txTrace/ui/StepInstructionBlock"

import PageHeader from "@shared/ui/PageHeader"
import Tutorial, {useTutorial} from "@shared/ui/Tutorial"

import {ShareButton} from "@shared/ui/ShareButton/ShareButton.tsx"
import {clearShareHash, decodeCodeFromUrl} from "@app/pages/GodboltPage/urlCodeSharing.ts"

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

const LOCAL_STORAGE_KEY = "txtracer-playground-assembly-code"
const INITIAL_STACK_STORAGE_KEY = "txtracer-playground-initial-stack"

function PlaygroundPage() {
  const [assemblyCode, setAssemblyCode] = useState(() => {
    const sharedCode = decodeCodeFromUrl()
    if (sharedCode !== null) {
      clearShareHash()
      return sharedCode
    }
    return localStorage.getItem(LOCAL_STORAGE_KEY) ?? DEFAULT_ASSEMBLY_CODE
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

  const trace = result?.traceInfo

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
  } = useTraceStepper(trace)

  const lineExecutionData = useLineExecutionData(trace)

  const instructionDetails: InstructionDetail[] = useMemo(() => {
    if (!trace) return []
    return trace.steps.map(step => ({
      name: step.instructionName,
      gasCost: normalizeGas(step),
    }))
  }, [trace])

  const cumulativeGas = useMemo(() => {
    if (!trace) return 0
    let totalGas = 0
    for (let i = 0; i < selectedStep; i++) {
      const step = trace.steps[i]
      if (step) {
        totalGas += normalizeGas(step)
      }
    }
    return totalGas
  }, [trace, selectedStep])

  const handleExecute = useCallback(async () => {
    if (!assemblyCode.trim()) {
      return
    }

    setLoading(true)
    clearError()

    try {
      const result = await executeAssemblyCode(assemblyCode, initialStack)
      setResult(result)
      console.log(result.vmLogs)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      setError(`Failed to execute assembly code: ${errorMessage}`)
      setResult(undefined)
    } finally {
      setLoading(false)
    }
  }, [assemblyCode, clearError, initialStack, setError])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault()
        if (!loading) {
          void handleExecute()
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [handleExecute, loading])

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, assemblyCode)
  }, [assemblyCode])

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
      setAssemblyCode(newCode)
      setResult(undefined)
      clearError()
    },
    [clearError],
  )

  const handleStackChange = useCallback((newStack: StackElement[]) => {
    setInitialStack(newStack)
    setResult(undefined)
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
          <div
            className={styles.mainActionContainer}
            role="toolbar"
            aria-label="Assembly code actions"
          >
            <ExecuteButton onClick={() => void handleExecute()} loading={loading} />
            <ShareButton value={assemblyCode} />
          </div>
        </div>
      </PageHeader>

      <div id="execution-status" className="sr-only" aria-live="polite" aria-atomic="true">
        {loading && "Executing assembly code..."}
        {result && !loading && "Assembly code executed successfully"}
        {result?.exitCode &&
          result.exitCode.num !== 0 &&
          !loading &&
          `Execution completed with exit code ${result.exitCode.num}`}
      </div>

      <div className="sr-only">Press Ctrl+Enter or Cmd+Enter to execute the assembly code</div>

      <main className={styles.appContainer} role="main" aria-label="Assembly code playground">
        <div className={styles.mainContent}>
          <div className={styles.editorContainer}>
            <h2 id="code-editor-heading" className="sr-only">
              Assembly Code Editor
            </h2>
            <Suspense fallback={<InlineLoader message="Loading Editor..." loading={true} />}>
              <CodeEditor
                code={assemblyCode}
                onChange={handleCodeChange}
                readOnly={false}
                highlightLine={highlightLine}
                lineExecutionData={lineExecutionData}
                implicitRetLine={implicitRet.line}
                implicitRetLabel={
                  implicitRet.approx ? "↵ implicit RET (approximate position)" : undefined
                }
                shouldCenter={transitionType === "button"}
                exitCode={result?.exitCode}
                onLineClick={findStepByLine}
                language={"tasm"}
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
