import {Suspense, useMemo, lazy} from "react"
import {FiX} from "react-icons/fi"

import type {TransactionInfo} from "@features/sandbox/lib/transaction"
import type {ContractData} from "@features/sandbox/lib/contract"
import {traceSandboxTransaction, normalizeGas} from "@features/txTrace/lib/traceTx"
import {useLineExecutionData, useTraceStepper} from "@features/txTrace/hooks"
import TraceSidePanel from "@shared/ui/TraceSidePanel"
import InlineLoader from "@shared/ui/InlineLoader"
import {type InstructionDetail} from "@features/txTrace/ui/StepInstructionBlock"

import styles from "./TransactionTraceViewer.module.css"

const CodeEditor = lazy(() => import("@shared/ui/CodeEditor"))

export interface TransactionTraceViewerProps {
  readonly tx: TransactionInfo
  readonly contracts: Map<string, ContractData>
  readonly onClose?: () => void
  readonly inline?: boolean
}

export function TransactionTraceViewer({
  tx,
  contracts,
  onClose,
  inline = false,
}: TransactionTraceViewerProps) {
  const traceResult = useMemo(() => {
    return traceSandboxTransaction(tx, contracts)
  }, [tx, contracts])

  const lineExecutionData = useLineExecutionData(traceResult?.traceInfo)
  const {
    selectedStep,
    highlightLine,
    currentStep,
    currentStack,
    handlePrev,
    handleNext,
    goToFirstStep,
    goToLastStep,
    canGoPrev,
    canGoNext,
    findStepByLine,
    transitionType,
    totalSteps,
  } = useTraceStepper(traceResult?.traceInfo)

  const instructionDetails = useMemo((): InstructionDetail[] => {
    if (!traceResult?.traceInfo) return []

    return traceResult.traceInfo.steps.map(step => ({
      name: step.instructionName,
      gasCost: normalizeGas(step),
    }))
  }, [traceResult])

  const cumulativeGasSinceBegin = useMemo(() => {
    if (!traceResult?.traceInfo?.steps || selectedStep <= 0) return 0

    let totalGas = 0
    for (let i = 0; i < selectedStep; i++) {
      const step = traceResult.traceInfo.steps[i]
      if (step) {
        const gasNum = normalizeGas(step)
        if (!isNaN(gasNum)) {
          totalGas += gasNum
        }
      }
    }
    return totalGas
  }, [selectedStep, traceResult?.traceInfo?.steps])

  if (!traceResult) {
    const containerClass = inline ? styles.inlineContainer : styles.container
    return (
      <div className={containerClass}>
        {!inline && (
          <div className={styles.header}>
            <h3 className={styles.title}>Transaction Trace</h3>
            {onClose && (
              <button
                onClick={onClose}
                className={styles.closeButton}
                aria-label="Close trace viewer"
              >
                <FiX size={20} />
              </button>
            )}
          </div>
        )}
        <div className={styles.content}>
          <div className={styles.noTrace}>
            No trace available for this transaction. The transaction may have been skipped or no VM
            logs were generated.
          </div>
        </div>
      </div>
    )
  }

  const containerClass = inline ? styles.inlineContainer : styles.container
  const contentClass = inline ? styles.inlineContent : styles.content
  const mainContentClass = inline ? styles.inlineMainContent : styles.mainContent

  return (
    <div className={containerClass}>
      <div className={contentClass}>
        <div className={mainContentClass}>
          <div className={styles.codeEditorArea}>
            <Suspense fallback={<InlineLoader message="Loading Editor..." loading={true} />}>
              <CodeEditor
                code={traceResult.code}
                highlightLine={highlightLine}
                lineExecutionData={lineExecutionData}
                onLineClick={findStepByLine}
                shouldCenter={transitionType === "button"}
                exitCode={traceResult.exitCode}
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
            showGas={true}
            placeholderMessage="No trace steps available."
            instructionDetails={instructionDetails}
            cumulativeGas={cumulativeGasSinceBegin}
            onStackItemClick={() => {}}
            className={styles.sidePanel}
          />
        </div>
      </div>
    </div>
  )
}
