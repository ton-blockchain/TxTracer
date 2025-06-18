import "@xyflow/react/dist/style.css"

import PageHeader from "@shared/ui/PageHeader"
import {useSandboxData} from "@features/sandbox/lib/useSandboxData"
import {ContractDetails, TestInfo} from "@app/pages/SandboxPage/components"

import styles from "./SandboxPage.module.css"

function SandboxPage() {
  const {tests, contracts, error} = useSandboxData()

  return (
    <div className={styles.traceViewWrapper}>
      <PageHeader pageTitle={"sandbox"}></PageHeader>

      <main className={styles.appContainer}>
        {error && <div className={styles.errorMessage}>{error}</div>}
        <div>
          {[...contracts.entries()].map(([, data], i) => (
            <ContractDetails
              key={i}
              contracts={contracts}
              contract={data}
              tests={tests}
              isDeployed={false}
            />
          ))}
          <br />
          {tests.map(testData => (
            <TestInfo key={testData.id} contracts={contracts} testData={testData} />
          ))}
        </div>
      </main>
    </div>
  )
}

export default SandboxPage
