import {useEffect, useState} from "react"

import styles from "./DaemonSettings.module.css"

interface DaemonSettingsProps {
  readonly host: string
  readonly port: string
  readonly onChange: (next: {host: string; port: string}) => void
}

const portIsValid = (port: string): boolean => {
  const portNumber = Number(port)
  if (isNaN(portNumber)) {
    return false
  }

  return portNumber >= 0 && portNumber <= 65535
}

export function DaemonSettings({host, port, onChange}: DaemonSettingsProps) {
  const [localHost, setLocalHost] = useState(host)
  const [localPort, setLocalPort] = useState(port)

  useEffect(() => setLocalHost(host), [host])
  useEffect(() => setLocalPort(port), [port])

  return (
    <div className={styles.container} title="WebSocket daemon connection settings">
      <div className={styles.fields}>
        <label className={styles.label}>
          <span className={styles.labelText}>Host:</span>
          <input
            className={styles.input}
            value={localHost}
            onChange={e => {
              const next = e.target.value
              setLocalHost(next)
              const trimmed = next.trim()
              if (trimmed.length > 0) {
                onChange({host: trimmed, port: localPort})
              }
            }}
            placeholder="localhost"
            aria-label="Daemon host"
          />
        </label>
        <label className={styles.label}>
          <span className={styles.labelText}>Port:</span>
          <input
            className={styles.input}
            value={localPort}
            onChange={e => {
              const raw = e.target.value
              const next = raw.replace(/[^0-9]/g, "")
              setLocalPort(next)
              if (next.length > 0 && portIsValid(next)) {
                onChange({host: localHost, port: next})
              }
            }}
            placeholder="7743"
            aria-label="Daemon port"
          />
        </label>
      </div>
    </div>
  )
}

export default DaemonSettings
