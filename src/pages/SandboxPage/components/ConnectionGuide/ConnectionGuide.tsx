import styles from "./ConnectionGuide.module.css"

export function ConnectionGuide() {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.leftColumn}>
          <h1 className={styles.title}>Sandbox Not Connected</h1>
          <p className={styles.description}>
            To work with Sandbox, please follow the setup instructions on the right.
          </p>
          <div className={styles.infoSection}>
            <h3 className={styles.infoTitle}>What is Web Sandbox?</h3>
            <p className={styles.infoText}>
              Web Sandbox extends the standard TON Sandbox with transaction tracing capabilities,
              allowing you to visualize and debug smart contract interactions in web interface.
            </p>
          </div>
        </div>

        <div className={styles.rightColumn}>
          <h2 className={styles.stepsTitle}>Setup Instructions</h2>
          <div className={styles.steps}>
            <div className={styles.step}>
              <div className={styles.stepNumber}>1</div>
              <div className={styles.stepContent}>
                <h3 className={styles.stepTitle}>Install web-sandbox-server</h3>
                <p className={styles.stepDescription}>
                  Install the custom library for TracingSandbox:
                </p>
                <code className={styles.codeBlock}>npm install web-sandbox-server</code>
              </div>
            </div>

            <div className={styles.step}>
              <div className={styles.stepNumber}>2</div>
              <div className={styles.stepContent}>
                <h3 className={styles.stepTitle}>Start the daemon</h3>
                <p className={styles.stepDescription}>
                  Open terminal, run the command and reload page:
                </p>
                <code className={styles.codeBlock}>npx run web-sandbox-server</code>
              </div>
            </div>

            <div className={styles.step}>
              <div className={styles.stepNumber}>3</div>
              <div className={styles.stepContent}>
                <h3 className={styles.stepTitle}>Change Blockchain in tests</h3>
                <p className={styles.stepDescription}>
                  In your tests, replace <code className={styles.inlineCode}>Blockchain</code> with{" "}
                  <code className={styles.inlineCode}>TracingBlockchain</code>:
                </p>
                <code className={styles.codeBlock}>
                  import {"{"}TracingBlockchain{"}"} from &quot;web-sandbox-server&quot;
                  <br />
                  const blockchain = await TracingBlockchain.create()
                </code>
              </div>
            </div>

            <div className={styles.step}>
              <div className={styles.stepNumber}>4</div>
              <div className={styles.stepContent}>
                <h3 className={styles.stepTitle}>Run your test and reload page</h3>
                <p className={styles.stepDescription}>
                  Run your test. Data will automatically appear in Sandbox
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
