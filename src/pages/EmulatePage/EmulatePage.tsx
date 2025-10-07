import {useState, useEffect} from "react"
import {FiArrowLeft, FiGithub} from "react-icons/fi"
import {Cell, loadMessage} from "@ton/core"

import type {EmulationError} from "@ton/sandbox"

import PageHeader from "@shared/ui/PageHeader"
import Button from "@shared/ui/Button"
import {TransactionTree} from "@app/pages/SandboxPage/components"
import {useSandboxData} from "@features/sandbox/lib/useSandboxData"
import {useGlobalError} from "@shared/lib/useGlobalError.tsx"

import {getRawQueryParam, setQueryParam} from "@features/common/lib/query-params.ts"

import {ExitCodeChip} from "@features/common/ui/ExitCodeChip/ExitCodeChip"

import {emulateMessage} from "./emulateMessage"
import styles from "./EmulatePage.module.css"

function EmulatePage() {
  const [rawMessage, setRawMessage] = useState("")
  const [isEmulating, setIsEmulating] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newMessage, setNewMessage] = useState("")
  const [allMessages, setAllMessages] = useState<string[]>([])
  const [isTestnet, setIsTestnet] = useState(false)
  const [ignoreChksig, setIgnoreChksig] = useState(false)
  const [emulationErrors, setEmulationErrors] = useState<readonly EmulationError[]>([])
  const [animatedText, setAnimatedText] = useState("")
  const [isAnimating, setIsAnimating] = useState(false)

  const {setError, clearError} = useGlobalError()

  const normalizeMessageToHex = (message: string): string => {
    const trimmed = message.trim()

    try {
      Cell.fromHex(trimmed)
      return trimmed
    } catch {
      try {
        Cell.fromBase64(trimmed)
        const buffer = Buffer.from(trimmed, "base64")
        return buffer.toString("hex")
      } catch {
        throw new Error("Message is invalid Cell")
      }
    }
  }

  const validateMessage = (message: string): string | undefined => {
    const trimmed = message.trim()

    if (!trimmed) {
      return "Message cannot be empty"
    }

    try {
      const hexMessage = normalizeMessageToHex(trimmed)
      const cell = Cell.fromHex(hexMessage)
      loadMessage(cell.asSlice())
      return undefined
    } catch (error) {
      if (error instanceof Error) {
        return "Failed to parse message: " + error.message
      }
      return "Invalid message format"
    }
  }

  const exampleMessage =
    "b5ee9c720102060100012b0001ad6800a82a7aa43e8441299d2a937e4499ea5424a64e57d050479cfefea07ebb0bcb870036b854e9d36252ef0c9d206633589b93d77d29a6b4be95b3a03f09912d5c23481406d5ba88a800000000000000000200000002c0010267ea06185d00000000000000005019d971e2a80059887087414684712ee07949af76475d6cbeb6a0a4c3388182937881124a56fa0c020501458006782fd72576f540683e048bc16f3715020eb4dba5fbe912e76da73ac8dc8453c0c0030145800361564f6ee70b7227610014e70f0f5b708175265958fbda002cf6dce0483afb60c0040045801c6119e5968d83b7a74656e33f13965ecedfa7df20bb4527934b02221a6821be0040004b00000000800a82a7aa43e8441299d2a937e4499ea5424a64e57d050479cfefea07ebb0bcb861"

  const handleLoadExample = () => {
    setRawMessage(exampleMessage)
    setIsFocused(true)
  }

  const handleAddMessage = async () => {
    const validationError = validateMessage(newMessage)
    if (validationError) {
      setError(validationError)
      return
    }

    setIsEmulating(true)
    clearError()

    try {
      const hexMessage = normalizeMessageToHex(newMessage)
      const result = await emulateMessage([hexMessage], isTestnet, ignoreChksig)

      if (result.error) {
        setError(result.error)
      } else {
        loadFromFile([result.testData])
        setEmulationErrors(result.errors ?? [])

        if (result.errors.length === 0) {
          setAllMessages(prev => [...prev, hexMessage.trim()])
          setNewMessage("")
          setShowAddForm(false)
        }
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unknown error occurred")
    } finally {
      setIsEmulating(false)
    }
  }

  const {tests, loadFromFile, clearFileData} = useSandboxData()

  useEffect(() => {
    const message = getRawQueryParam("message") ?? ""
    if (message) {
      setRawMessage(message)
    }

    const testnetParam = getRawQueryParam("testnet")
    if (testnetParam !== null) {
      setIsTestnet(testnetParam === "true")
    }

    const ignoreChksigParam = getRawQueryParam("ignoreChksig")
    if (ignoreChksigParam !== null) {
      setIgnoreChksig(ignoreChksigParam === "true")
    }
  }, [])

  useEffect(() => {
    setQueryParam("testnet", isTestnet ? "true" : null)
  }, [isTestnet])

  useEffect(() => {
    setQueryParam("ignoreChksig", ignoreChksig ? "true" : null)
  }, [ignoreChksig])

  useEffect(() => {
    const targetText = isTestnet ? " in Testnet" : ""

    if (animatedText === targetText) {
      setIsAnimating(false)
      return
    }

    setIsAnimating(true)
    let currentIndex = animatedText.length
    const direction = animatedText.length < targetText.length ? 1 : -1

    const interval = setInterval(() => {
      if (direction > 0) {
        currentIndex++
        setAnimatedText(targetText.slice(0, currentIndex))
        if (currentIndex >= targetText.length) {
          clearInterval(interval)
          setIsAnimating(false)
        }
      } else {
        currentIndex--
        setAnimatedText(animatedText.slice(0, currentIndex))
        if (currentIndex <= 0) {
          clearInterval(interval)
          setIsAnimating(false)
        }
      }
    }, 100)

    return () => clearInterval(interval)
  }, [animatedText, isTestnet])

  const handleEmulate = async () => {
    const validationError = validateMessage(rawMessage)
    if (validationError) {
      setError(validationError)
      return
    }

    setIsEmulating(true)
    clearError()
    clearFileData()
    setEmulationErrors([])

    try {
      const hexMessage = normalizeMessageToHex(rawMessage)
      const result = await emulateMessage([hexMessage], isTestnet, ignoreChksig)

      if (result.error) {
        setError(result.error)
      } else {
        loadFromFile([result.testData])
        setEmulationErrors(result.errors)

        if (result.errors.length === 0) {
          setAllMessages([hexMessage.trim()])
          setShowResults(true)
        }
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unknown error occurred")
    } finally {
      setIsEmulating(false)
    }
  }

  const handleEmulateAll = async () => {
    const validationError = validateMessage(newMessage)
    if (validationError) {
      setError(validationError)
      return
    }

    for (let i = 0; i < allMessages.length; i++) {
      const error = validateMessage(allMessages[i])
      if (error) {
        setError(`Message ${i + 1} is invalid: ${error}`)
        return
      }
    }

    setIsEmulating(true)
    clearError()
    clearFileData()
    setEmulationErrors([] as readonly EmulationError[])

    const messagesToEmulate = [...allMessages, newMessage.trim()]

    try {
      const result = await emulateMessage(messagesToEmulate, isTestnet, ignoreChksig)

      if (result.error) {
        setError(result.error)
      } else {
        loadFromFile([result.testData])
        setEmulationErrors(result.errors)
        setAllMessages(messagesToEmulate)
        setNewMessage("")
        setShowAddForm(false)
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unknown error occurred")
    } finally {
      setIsEmulating(false)
    }
  }

  const handleBack = () => {
    setShowResults(false)
    clearError()
    clearFileData()
    setAllMessages([])
    setEmulationErrors([] as readonly EmulationError[])
  }

  if (showResults) {
    return (
      <div className={styles.traceViewWrapper}>
        <PageHeader pageTitle="emulate">
          <div className={styles.headerContent}>
            <div className={styles.headerControls}>
              <Button variant="outline" onClick={handleBack} className={styles.backButton}>
                <FiArrowLeft className={styles.backIcon} />
                Back
              </Button>
            </div>
          </div>
        </PageHeader>

        <main className={styles.appContainer}>
          {tests.length > 0 ? (
            tests.map(testData => (
              <TransactionTree key={`tree-${testData.testName}`} testData={testData} />
            ))
          ) : (
            <div className={styles.noResults}>
              <p>No transactions found in the emulation result.</p>
            </div>
          )}

          <div className={styles.addButtonContainer}>
            <button
              type="button"
              onClick={() => setShowAddForm(!showAddForm)}
              className={styles.addButton}
              aria-label="Add another message"
              title="Add another message to emulate"
            ></button>
          </div>

          {showAddForm && (
            <div className={styles.addForm}>
              <div className={styles.inputSection}>
                <div className={styles.inputWrapper}>
                  <textarea
                    id="newMessage"
                    className={styles.messageInput}
                    placeholder="Enter another message in HEX or Base64..."
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    rows={6}
                    onKeyDown={e => {
                      if (e.key === "Enter" && !isEmulating) {
                        if (!(e.ctrlKey || e.metaKey)) {
                          e.preventDefault()
                          void handleAddMessage()
                        }
                      }
                    }}
                  />
                  <div className={styles.buttonGroup}>
                    <Button
                      variant="outline"
                      onClick={() => void handleAddMessage()}
                      disabled={!newMessage.trim() || isEmulating}
                      className={styles.addMessageButton}
                    >
                      {isEmulating ? "Adding..." : "Add Message"}
                    </Button>
                    <Button
                      variant="primary"
                      onClick={() => void handleEmulateAll()}
                      disabled={!newMessage.trim() || isEmulating}
                      className={styles.emulateAllButton}
                    >
                      {isEmulating ? "Emulating..." : "Re-emulate with this message"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    )
  }

  return (
    <div className={styles.traceViewWrapper}>
      {!showResults && (
        <>
          <div className={styles.externalLinksContainer}>
            <a
              href="https://github.com/ton-blockchain/txtracer"
              target="_blank"
              rel="noopener noreferrer"
              title="GitHub Repository"
              className={styles.iconLink}
              aria-label="View TxTracer source code on GitHub"
            >
              <FiGithub size={24} aria-hidden="true" />
            </a>
          </div>

          <main className={styles.inputPage}>
            <div id="emulate-status" className="sr-only" aria-live="polite" aria-atomic="true">
              {isEmulating && "Emulating message..."}
            </div>

            <div className="sr-only">Press Enter to emulate the message</div>

            <div className={styles.centeredInputContainer}>
              <header className={styles.emulateLogo}>
                <div className={styles.logoDiamond} aria-hidden="true"></div>
                <h1 data-testid="app-title" className={styles.emulateLogoH1}>
                  <a href="/" className={styles.emulateLogoLink}>
                    <span>TxTracer</span>
                  </a>
                  <span className={styles.titleEmulate}>
                    Emulate
                    <span
                      className={`${styles.animatedTestnet} ${isAnimating ? styles.animating : ""}`}
                    >
                      {animatedText}
                    </span>
                  </span>
                </h1>
              </header>

              <section aria-labelledby="emulate-heading" className={styles.inputCard}>
                <h2 id="emulate-heading" className="sr-only">
                  Message Emulation
                </h2>
                <div className={styles.inputSection}>
                  <div className={`${styles.inputWrapper} ${isFocused ? styles.focused : ""}`}>
                    <textarea
                      id="hexMessage"
                      className={styles.messageInput}
                      placeholder="Enter encoded message in HEX or Base64..."
                      value={rawMessage}
                      onChange={e => setRawMessage(e.target.value)}
                      rows={6}
                      autoFocus={true}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setIsFocused(false)}
                      spellCheck={false}
                      onKeyDown={e => {
                        if (e.key === "Enter" && !isEmulating) {
                          if (!(e.ctrlKey || e.metaKey)) {
                            e.preventDefault()
                            void handleEmulate()
                          }
                        }
                      }}
                    />
                    <Button
                      variant="primary"
                      onClick={() => void handleEmulate()}
                      disabled={!rawMessage.trim() || isEmulating}
                      className={styles.submitButton}
                    >
                      {isEmulating ? "Emulating..." : "Emulate"}
                    </Button>
                  </div>
                </div>

                <div className={styles.exampleSection}>
                  <span className={styles.exampleText}>
                    Not sure what this does?
                    <button
                      type="button"
                      onClick={handleLoadExample}
                      className={styles.exampleButton}
                      disabled={isEmulating}
                    >
                      Try an example!
                    </button>
                  </span>
                  <div className={styles.checkboxesContainer}>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={isTestnet}
                        onChange={e => setIsTestnet(e.target.checked)}
                        disabled={isEmulating}
                      />
                      Use Testnet
                    </label>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={ignoreChksig}
                        onChange={e => setIgnoreChksig(e.target.checked)}
                        disabled={isEmulating}
                      />
                      Ignore Chksig
                    </label>
                  </div>
                </div>

                {emulationErrors.length > 0 && (
                  <div className={styles.emulationErrors}>
                    <div className={styles.errorsLogsContainer}>
                      <div className={styles.errorsList}>
                        {emulationErrors.map((error, index) => (
                          <div key={index} className={styles.errorItem}>
                            <div className={styles.errorHeader}>
                              <div className={styles.errorType}>Emulation Error</div>
                              <div className={styles.errorIndex}>#{index + 1}</div>
                              <div className={styles.errorExitCode}>
                                <ExitCodeChip exitCode={error.exitCode} />
                              </div>
                            </div>

                            <div className={styles.errorDescription}>{error.error}</div>

                            <div className={styles.errorFields}>
                              {Object.entries(error).map(([key, value]) => {
                                if (key === "error" || key === "exitCode") return null
                                if (typeof value === "object" && value !== null) return null
                                if (value === null || value === undefined) return null

                                const stringValue =
                                  typeof value === "string" ? value : String(value)

                                if (stringValue === "") return null
                                const isLongContent = stringValue.length > 500

                                return (
                                  <div key={key} className={styles.errorField}>
                                    <div className={styles.errorFieldLabel}>
                                      {key
                                        .replace(/([A-Z])/g, " $1")
                                        .replace(/^./, str => str.toUpperCase())}
                                    </div>
                                    <div
                                      className={`${styles.errorFieldValue} ${isLongContent ? styles["--long-content"] : ""}`}
                                    >
                                      {stringValue}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </section>
            </div>
          </main>
        </>
      )}
    </div>
  )
}

export default EmulatePage
