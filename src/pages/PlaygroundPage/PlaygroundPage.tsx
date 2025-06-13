import React, {useState, useCallback, Suspense, useMemo, useEffect} from "react"

import {FiPlay} from "react-icons/fi"

import InlineLoader from "@shared/ui/InlineLoader"
import TraceSidePanel from "@shared/ui/TraceSidePanel"
import {executeAssemblyCode, type AssemblyExecutionResult} from "@features/tasm/lib/executor.ts"
import {useGlobalError} from "@shared/lib/errorContext"
import StatusBadge, {type StatusType} from "@shared/ui/StatusBadge"
import {useLineExecutionData, useTraceStepper} from "@features/txTrace/hooks"
import {normalizeGas} from "@features/txTrace/lib/traceTx"
import type {InstructionDetail} from "@features/txTrace/ui/StepInstructionBlock"

import PageHeader from "@shared/ui/PageHeader"
import Button from "@shared/ui/Button"
import ButtonLoader from "@shared/ui/ButtonLoader/ButtonLoader.tsx"

import styles from "./PlaygroundPage.module.css"

const CodeEditor = React.lazy(() => import("@shared/ui/CodeEditor"))

const DEFAULT_ASSEMBLY_CODE = `SETCP 0
PUSHINT_8 42
PUSHINT_8 100
ADD
PUSHINT_16 200
SUB

NOP
`

const LOCAL_STORAGE_KEY = "txtracer-playground-assembly-code"

function PlaygroundPage() {
  const [assemblyCode, setAssemblyCode] = useState(() => {
    return localStorage.getItem(LOCAL_STORAGE_KEY) ?? DEFAULT_ASSEMBLY_CODE
  })
  const [result, setResult] = useState<AssemblyExecutionResult | undefined>(undefined)
  const [loading, setLoading] = useState(false)
  const {setError, clearError} = useGlobalError()

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
    setResult(undefined)

    try {
      const result = await executeAssemblyCode(assemblyCode)
      setResult(result)
      console.log(result.vmLogs)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      setError(`Failed to execute assembly code: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }, [assemblyCode, clearError, setError])

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, assemblyCode)
  }, [assemblyCode])

  const handleCodeChange = useCallback(
    (newCode: string) => {
      setAssemblyCode(newCode)
      setResult(undefined)
      clearError()
    },
    [clearError],
  )

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
          <div className={styles.txStatusContainer}>
            {txStatus && <StatusBadge type={txStatus} text={txStatusText} />}
          </div>
        )}
        <div className={styles.headerContent}>
          <div className={styles.mainActionContainer}>
            <Button
              onClick={() => void handleExecute()}
              disabled={loading}
              className={styles.executeButton}
              title="Execute Assembly Code"
            >
              {loading ? (
                <ButtonLoader>Execute</ButtonLoader>
              ) : (
                <>
                  <FiPlay size={16} />
                  Execute
                </>
              )}
            </Button>
          </div>
        </div>
      </PageHeader>

      <div className={styles.appContainer}>
        <div className={styles.mainContent}>
          <div style={{flex: "1", position: "relative"}}>
            <Suspense fallback={<InlineLoader message="Loading Editor..." loading={true} />}>
              <CodeEditor
                code={assemblyCode}
                onChange={handleCodeChange}
                readOnly={false}
                highlightLine={highlightLine}
                lineExecutionData={lineExecutionData}
                shouldCenter={transitionType === "button"}
                exitCode={result?.exitCode}
                onLineClick={findStepByLine}
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
          />
        </div>
      </div>
    </div>
  )
}

export default PlaygroundPage
