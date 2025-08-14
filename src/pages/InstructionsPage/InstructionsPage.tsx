import {useEffect, useState} from "react"

import PageHeader from "@shared/ui/PageHeader"
import InstructionTable from "@app/pages/InstructionsPage/components/InstructionTable/InstructionTable.tsx"
import tvmSpecData from "@features/spec/gen/tvm-specification.json"

import type {TvmSpec} from "@features/spec/tvm-specification.types.ts"

import styles from "./InstructionsPage.module.css"

function InstructionsPage() {
  const [spec, setSpec] = useState<TvmSpec | null>(null)
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({})

  useEffect(() => {
    setSpec(tvmSpecData as unknown as TvmSpec)
  }, [])

  if (!spec) {
    return <div>Loading specification...</div>
  }

  const handleRowClick = (instructionName: string) => {
    setExpandedRows(prev => ({
      ...prev,
      [instructionName]: !prev[instructionName],
    }))
  }

  return (
    <div className={styles.traceViewWrapper}>
      <PageHeader pageTitle="spec"></PageHeader>

      <main className={styles.appContainer} role="main" aria-label="TVM Instructions">
        <div className={styles.mainContent}>
          <InstructionTable
            instructions={spec.instructions}
            expandedRows={expandedRows}
            onRowClick={handleRowClick}
          />
        </div>
      </main>
    </div>
  )
}

export default InstructionsPage
