import InlineLoader from "@shared/ui/InlineLoader"
import Icon, {CheckIcon, LightBulbIcon, RocketIcon, RefreshIcon, CodeIcon} from "@shared/ui/Icon"

import styles from "./LoadingState.module.css"

export function LoadingState() {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.leftColumn}>
          <h2 className={styles.title}>Waiting for Data</h2>
          <p className={styles.description}>
            Connection established. Waiting for data from running tests...
          </p>
          <div className={styles.statusSection}>
            <h3 className={styles.statusTitle}>Connection Status</h3>
            <div className={styles.statusItem}>
              <Icon svg={<CheckIcon />} size={32} className={styles.statusIcon} />
              <span>WebSocket connected</span>
            </div>
            <div className={styles.statusItem}>
              <div className={styles.statusIcon}>
                <InlineLoader loading={true} message="" />
              </div>
              <span>Waiting for test data</span>
            </div>
          </div>
        </div>

        <div className={styles.rightColumn}>
          <div className={styles.tips}>
            <div className={styles.tip}>
              <Icon svg={<LightBulbIcon />} size={24} className={styles.tipIcon} />
              <div className={styles.tipContent}>
                <h3 className={styles.tipTitle}>Set webUI: true in your Blockchain.create()</h3>
                <p className={styles.tipText}>
                  Make sure your tests use{" "}
                  <code className={styles.inlineCode}>{`Blockchain.create({ webUI: true })`}</code>
                </p>
              </div>
            </div>
            <div className={styles.tip}>
              <Icon svg={<RocketIcon />} size={24} className={styles.tipIcon} />
              <div className={styles.tipContent}>
                <h3 className={styles.tipTitle}>Run Your Tests</h3>
                <p className={styles.tipText}>
                  Execute your test suite and data will appear automatically in real-time
                </p>
              </div>
            </div>
            <div className={styles.tip}>
              <Icon svg={<RefreshIcon />} size={24} className={styles.tipIcon} />
              <div className={styles.tipContent}>
                <h3 className={styles.tipTitle}>Live Updates</h3>
                <p className={styles.tipText}>
                  No need to refresh - new transactions will appear as they are executed
                </p>
              </div>
            </div>
            <div className={styles.tip}>
              <Icon svg={<CodeIcon />} size={24} className={styles.tipIcon} />
              <div className={styles.tipContent}>
                <h3 className={styles.tipTitle}>Debug Smart Contracts</h3>
                <p className={styles.tipText}>
                  Trace transactions step-by-step to understand contract execution flow and debug
                  issues
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
