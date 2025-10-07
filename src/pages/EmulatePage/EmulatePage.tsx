import {useState, useEffect} from "react"
import {FiArrowLeft, FiGithub} from "react-icons/fi"

import PageHeader from "@shared/ui/PageHeader"
import Button from "@shared/ui/Button"
import {TransactionTree} from "@app/pages/SandboxPage/components"
import {useSandboxData} from "@features/sandbox/lib/useSandboxData"
import {useGlobalError} from "@shared/lib/useGlobalError.tsx"

import {getRawQueryParam} from "@features/common/lib/query-params.ts"

import {emulateMessage} from "./emulateMessage"
import styles from "./EmulatePage.module.css"

function EmulatePage() {
  const [hexMessage, setHexMessage] = useState("")
  const [isEmulating, setIsEmulating] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newMessage, setNewMessage] = useState("")
  const [allMessages, setAllMessages] = useState<string[]>([])

  const {setError, clearError} = useGlobalError()

  const exampleMessage =
    "b5ee9c720102060100012b0001ad6800a82a7aa43e8441299d2a937e4499ea5424a64e57d050479cfefea07ebb0bcb870036b854e9d36252ef0c9d206633589b93d77d29a6b4be95b3a03f09912d5c23481406d5ba88a800000000000000000200000002c0010267ea06185d00000000000000005019d971e2a80059887087414684712ee07949af76475d6cbeb6a0a4c3388182937881124a56fa0c020501458006782fd72576f540683e048bc16f3715020eb4dba5fbe912e76da73ac8dc8453c0c0030145800361564f6ee70b7227610014e70f0f5b708175265958fbda002cf6dce0483afb60c0040045801c6119e5968d83b7a74656e33f13965ecedfa7df20bb4527934b02221a6821be0040004b00000000800a82a7aa43e8441299d2a937e4499ea5424a64e57d050479cfefea07ebb0bcb861"

  const handleLoadExample = () => {
    setHexMessage(exampleMessage)
    setIsFocused(true)
  }

  const handleAddMessage = async () => {
    if (newMessage.trim() === "") return // should not happen since the button is disabled if the input is empty

    setIsEmulating(true)
    clearError()

    try {
      const result = await emulateMessage([newMessage.trim()])

      if (result.error) {
        setError(result.error)
      } else {
        loadFromFile([result.testData])
        setAllMessages(prev => [...prev, newMessage.trim()])
        setNewMessage("")
        setShowAddForm(false)
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
      setHexMessage(message)
    }
  }, [])

  const handleEmulate = async () => {
    if (!hexMessage.trim()) return

    setIsEmulating(true)
    clearError()
    clearFileData()

    try {
      const result = await emulateMessage([hexMessage.trim()])

      if (result.error) {
        setError(result.error)
      } else {
        loadFromFile([result.testData])
        setAllMessages([hexMessage.trim()])
        setShowResults(true)
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unknown error occurred")
    } finally {
      setIsEmulating(false)
    }
  }

  const handleEmulateAll = async () => {
    if (newMessage.trim() === "") return

    setIsEmulating(true)
    clearError()
    clearFileData()

    const messagesToEmulate = [...allMessages, newMessage.trim()]

    try {
      const result = await emulateMessage(messagesToEmulate)

      if (result.error) {
        setError(result.error)
      } else {
        loadFromFile([result.testData])
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
                    className={styles.hexInput}
                    placeholder="Enter another raw hex message..."
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
                      {isEmulating ? "Emulating..." : "Emulate All"}
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
                  <span>TxTracer</span>
                  <span className={styles.titleEmulate}>Emulate</span>
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
                      className={styles.hexInput}
                      placeholder="Enter encoded message in HEX..."
                      value={hexMessage}
                      onChange={e => setHexMessage(e.target.value)}
                      rows={6}
                      autoFocus={true}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setIsFocused(false)}
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
                      disabled={!hexMessage.trim() || isEmulating}
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
                </div>
              </section>
            </div>
          </main>
        </>
      )}
    </div>
  )
}

export default EmulatePage
