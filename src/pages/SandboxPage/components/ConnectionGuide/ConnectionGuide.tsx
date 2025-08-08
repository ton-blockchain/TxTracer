import {FiInfo} from "react-icons/fi"

import type {MessageTestData} from "@features/sandbox/lib/transport/message.ts"

import {CopyButton} from "@shared/CopyButton/CopyButton"

import {ExampleDataButtons} from "../ExampleDataButtons"
import {DaemonSettings} from "../DaemonSettings/DaemonSettings"

import styles from "./ConnectionGuide.module.css"

interface ConnectionGuideProps {
  readonly onLoadExample?: (data: MessageTestData[]) => void
  readonly host?: string
  readonly port?: string
  readonly onChange?: (next: {host: string; port: string}) => void
}

export function ConnectionGuide({
  onLoadExample,
  host = "localhost",
  port = "8081",
  onChange,
}: ConnectionGuideProps) {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.leftColumn}>
          <h1 className={styles.title}>Sandbox Not Connected</h1>
          <p className={styles.description}>
            To work with Sandbox, please follow the setup instructions on the right.
          </p>
          {onLoadExample && <ExampleDataButtons onDataLoaded={onLoadExample} />}
          <div className={styles.infoSection}>
            <h3 className={styles.infoTitle}>
              <span className={styles.infoIcon} aria-hidden="true">
                <FiInfo size={18} />
              </span>
              What is Sandbox UI?
            </h3>
            <p className={styles.infoText}>
              Sandbox UI extends the standard TON Sandbox with transaction tracing capabilities,
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
                <div className={styles.codeBlockWrapper}>
                  <code className={styles.codeBlock}>yarn add ton-sandbox-dev@0.35.46</code>
                  <CopyButton
                    className={styles.copyBtn}
                    value={"yarn add ton-sandbox-dev@0.35.46"}
                    title={"Command"}
                  />
                </div>
              </div>
            </div>

            <div className={styles.step}>
              <div className={styles.stepNumber}>2</div>
              <div className={styles.stepContent}>
                <h3 className={styles.stepTitle}>Configure connection</h3>
                <p className={styles.stepDescription}>
                  Set sandbox server host and port if needed:
                </p>
                <DaemonSettings host={host} port={port} onChange={onChange ?? (() => {})} />
              </div>
            </div>

            <div className={styles.step}>
              <div className={styles.stepNumber}>3</div>
              <div className={styles.stepContent}>
                <h3 className={styles.stepTitle}>Start the daemon</h3>
                <p className={styles.stepDescription}>
                  Open terminal, run the command and reload this page:
                </p>
                <div className={styles.codeBlockWrapper}>
                  <code className={styles.codeBlock}>
                    {`./node_modules/.bin/sandbox-server -p ${port}`}
                  </code>
                  <CopyButton
                    className={styles.copyBtn}
                    value={`./node_modules/.bin/sandbox-server -p ${port}`}
                    title={"Command"}
                  />
                </div>
              </div>
            </div>

            <div className={styles.step}>
              <div className={styles.stepNumber}>4</div>
              <div className={styles.stepContent}>
                <h3 className={styles.stepTitle}>Change Blockchain in tests</h3>
                <p className={styles.stepDescription}>
                  In your tests, use{" "}
                  <code className={styles.inlineCode}>{`Blockchain.create({ webUI: true })`}</code>
                </p>
                <div className={styles.codeBlockWrapper}>
                  <code className={styles.codeBlock}>
                    {`await Blockchain.create({ webUI: true });`}
                  </code>
                </div>
              </div>
            </div>

            <div className={styles.step}>
              <div className={styles.stepNumber}>5</div>
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
