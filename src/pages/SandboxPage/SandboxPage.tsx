import "@xyflow/react/dist/style.css"

import {useEffect, useState, useMemo} from "react"

import PageHeader from "@shared/ui/PageHeader"
import {useSandboxData} from "@features/sandbox/lib/useSandboxData"
import {TestInfo, ConnectionGuide, LoadingState} from "@app/pages/SandboxPage/components"
import {UploadTestDataButton} from "@app/pages/SandboxPage/components/UploadTestDataButton"
import {loadExampleByKey} from "@app/pages/SandboxPage/components/examples"

import styles from "./SandboxPage.module.css"

function SandboxPage() {
  const [host, setHost] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const v = localStorage.getItem("sandbox-daemon-host")
      const trimmed = (v ?? "").trim()
      return trimmed.length ? trimmed : "localhost"
    }
    return "localhost"
  })
  const [port, setPort] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const v = localStorage.getItem("sandbox-daemon-port")
      const digits = (v ?? "").replace(/[^0-9]/g, "")
      return digits.length ? digits : "7743"
    }
    return "7743"
  })

  const url = useMemo(() => `ws://${host}:${port}` as const, [host, port])

  const {tests, error, isConnected, isSharedData, rawData, loadFromFile} = useSandboxData({url})

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const exampleKey = params.get("example")
    if (!exampleKey) return
    void loadExampleByKey(exampleKey).then(data => {
      if (data) {
        loadFromFile(data)
      }
    })
  }, [loadFromFile])

  if (isSharedData) {
    return (
      <div className={styles.traceViewWrapper}>
        <PageHeader pageTitle={"sandbox"} titleBadgeText="Alpha" titleBadgeColor="green">
          <div className={styles.headerContent}>
            <div className={styles.headerControls}>
              <UploadTestDataButton onDataLoaded={loadFromFile} />
            </div>
          </div>
        </PageHeader>

        <main className={styles.appContainer}>
          {tests.map((testData, index) => (
            <TestInfo
              key={testData.testName}
              testData={testData}
              testIndex={index + 1}
              rawTestData={rawData.filter(it => it.testName === testData.testName)}
            />
          ))}
        </main>
      </div>
    )
  }

  const header = (
    <PageHeader pageTitle={"sandbox"} titleBadgeText="Alpha" titleBadgeColor="green">
      <div className={styles.headerContent}>
        <div className={styles.headerControls}>
          <UploadTestDataButton onDataLoaded={loadFromFile} />
        </div>
      </div>
    </PageHeader>
  )

  if (!isConnected) {
    return (
      <div className={styles.traceViewWrapper}>
        {header}
        <div className={styles.fullPageState}>
          <ConnectionGuide
            onLoadExample={loadFromFile}
            host={host}
            port={port}
            onChange={({host: h, port: p}) => {
              const nextHost = h.trim() ?? "localhost"
              const nextPort = (p ?? "").replace(/[^0-9]/g, "") ?? "7743"
              setHost(nextHost)
              setPort(nextPort)
              if (typeof window !== "undefined") {
                localStorage.setItem("sandbox-daemon-host", nextHost)
                localStorage.setItem("sandbox-daemon-port", nextPort)
              }
            }}
          />
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
      <PageHeader pageTitle={"sandbox"} titleBadgeText="Alpha" titleBadgeColor="blue">
        <div className={styles.headerContent}>
          <div className={styles.headerControls}>
            <UploadTestDataButton onDataLoaded={loadFromFile} />
          </div>
        </div>
      </PageHeader>

      <main className={styles.appContainer}>
        {error && <div className={styles.errorMessage}>{error}</div>}
        <div>
          {tests.map((testData, index) => (
            <TestInfo
              key={testData.testName}
              testData={testData}
              testIndex={index + 1}
              rawTestData={rawData.filter(it => it.testName === testData.testName)}
            />
          ))}
        </div>
      </main>
    </div>
  )
}

export default SandboxPage
