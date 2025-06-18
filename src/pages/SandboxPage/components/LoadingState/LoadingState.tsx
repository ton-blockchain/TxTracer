import InlineLoader from "@shared/ui/InlineLoader"

import styles from "./LoadingState.module.css"

export function LoadingState() {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.leftColumn}>
          <div className={styles.iconContainer}>
            <InlineLoader loading={true} message="" />
          </div>
          <h2 className={styles.title}>Waiting for Data</h2>
          <p className={styles.description}>
            Connection established. Waiting for data from running tests...
          </p>
          <div className={styles.statusSection}>
            <h3 className={styles.statusTitle}>Connection Status</h3>
            <div className={styles.statusItem}>
              <span className={styles.statusIndicator}>✅</span>
              <span>WebSocket connected</span>
            </div>
            <div className={styles.statusItem}>
              <span className={styles.statusIndicator}>⏳</span>
              <span>Waiting for test data</span>
            </div>
          </div>
        </div>

        <div className={styles.rightColumn}>
          <h3 className={styles.tipsTitle}>Quick Tips</h3>
          <div className={styles.tips}>
            <div className={styles.tip}>
              <div className={styles.tipIcon}>💡</div>
              <div className={styles.tipContent}>
                <h4 className={styles.tipTitle}>Use TracingBlockchain</h4>
                <p className={styles.tipText}>
                  Make sure your tests use{" "}
                  <code className={styles.inlineCode}>TracingBlockchain</code> instead of regular
                  Blockchain
                </p>
              </div>
            </div>
            <div className={styles.tip}>
              <div className={styles.tipIcon}>🚀</div>
              <div className={styles.tipContent}>
                <h4 className={styles.tipTitle}>Run Your Tests</h4>
                <p className={styles.tipText}>
                  Execute your test suite and data will appear automatically in real-time
                </p>
              </div>
            </div>
            <div className={styles.tip}>
              <div className={styles.tipIcon}>🔄</div>
              <div className={styles.tipContent}>
                <h4 className={styles.tipTitle}>Live Updates</h4>
                <p className={styles.tipText}>
                  No need to refresh - new transactions will appear as they are executed
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
