import InlineLoader from "@shared/ui/InlineLoader"

import styles from "./LoadingState.module.css"

export function LoadingState() {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.iconContainer}>
          <InlineLoader loading={true} message="" />
        </div>
        <h2 className={styles.title}>Waiting for Data</h2>
        <p className={styles.description}>
          Connection established. Waiting for data from running tests...
        </p>
        <div className={styles.tips}>
          <p className={styles.tip}>
            💡 &nbsp;Make sure your tests use{" "}
            <code className={styles.inlineCode}>TracingBlockchain</code>
          </p>
          <p className={styles.tip}>🚀 &nbsp;Run a test and data will appear automatically</p>
        </div>
      </div>
    </div>
  )
}
