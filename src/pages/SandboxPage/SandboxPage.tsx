import PageHeader from "@shared/ui/PageHeader"

import styles from "./SandboxPage.module.css"

function SandboxPage() {
  return (
    <>
      <div className={styles.traceViewWrapper}>
        <PageHeader pageTitle={"Sandbox"}></PageHeader>

        <main className={styles.appContainer}></main>
      </div>
    </>
  )
}

export default SandboxPage
