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
                <h3 className={styles.stepTitle}>Install custom sandbox package</h3>
                <p className={styles.stepDescription}>Install development sandbox package:</p>
                <code className={styles.codeBlock}>yarn add ton-sandbox-dev@0.35.37</code>
              </div>
            </div>

            <div className={styles.step}>
              <div className={styles.stepNumber}>2</div>
              <div className={styles.stepContent}>
                <h3 className={styles.stepTitle}>Start the daemon</h3>
                <p className={styles.stepDescription}>
                  Open terminal, run the command and reload this page:
                </p>
                <code className={styles.codeBlock}>./node_modules/.bin/sandbox-server</code>
              </div>
            </div>

            <div className={styles.step}>
              <div className={styles.stepNumber}>3</div>
              <div className={styles.stepContent}>
                <h3 className={styles.stepTitle}>Change Blockchain in tests</h3>
                <p className={styles.stepDescription}>
                  In your tests, use{" "}
                  <code className={styles.inlineCode}>{`Blockchain.create({ webUI: true })`}</code>
                </p>
                <code className={styles.codeBlock}>
                  {`await Blockchain.create({ webUI: true });`}
                </code>
              </div>
            </div>

            <div className={styles.step}>
              <div className={styles.stepNumber}>4</div>
              <div className={styles.stepContent}>
                <h3 className={styles.stepTitle}>Run your test</h3>
                <p className={styles.stepDescription}>Data will automatically appear here</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
