import "@xyflow/react/dist/style.css"

import PageHeader from "@shared/ui/PageHeader"
import {useSandboxData} from "@features/sandbox/lib/useSandboxData"
import {TestInfo, ConnectionGuide, LoadingState} from "@app/pages/SandboxPage/components"

import styles from "./SandboxPage.module.css"

function SandboxPage() {
  const {tests, error, isConnected} = useSandboxData()

  const header = (
    <PageHeader pageTitle={"sandbox"}>
      <div className={styles.headerContent}></div>
    </PageHeader>
  )

  if (!isConnected) {
    return (
      <div className={styles.traceViewWrapper}>
        {header}
        <div className={styles.fullPageState}>
          <ConnectionGuide />
        </div>
      </div>
    )
  }

  if (isConnected && tests.length === 0 && !error) {
    return (
      <div className={styles.traceViewWrapper}>
        {header}
        <div className={styles.fullPageState}>
          <LoadingState />
        </div>
      </div>
    )
  }

  return (
    <div className={styles.traceViewWrapper}>
      <PageHeader pageTitle={"sandbox"}>
        <div className={styles.headerContent}></div>
      </PageHeader>

      <main className={styles.appContainer}>
        {error && <div className={styles.errorMessage}>{error}</div>}
        <div>
          {/*{[...contracts.entries()].map(([, data], i) => (*/}
          {/*  <ContractDetails*/}
          {/*    key={i}*/}
          {/*    contracts={contracts}*/}
          {/*    contract={data}*/}
          {/*    tests={tests}*/}
          {/*    isDeployed={false}*/}
          {/*  />*/}
          {/*))}*/}
          {/*<br />*/}
          {tests.map(testData => (
            <TestInfo key={testData.id} testData={testData} />
          ))}
        </div>
      </main>
    </div>
  )
}

export default SandboxPage
