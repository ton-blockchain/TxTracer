import React, {useRef, useCallback, useEffect, useState} from "react"
import {FiSettings} from "react-icons/fi"

import {type GodboltSettingsHook} from "../hooks/useGodboltSettings"

import styles from "../GodboltPage.module.css"

interface SettingsDropdownProps {
  readonly hooks: GodboltSettingsHook
}

export const SettingsDropdown: React.FC<SettingsDropdownProps> = ({hooks}) => {
  const [isOpen, setIsOpen] = useState(false)
  const settingsRef = useRef<HTMLDivElement | null>(null)
  const settingsButtonRef = useRef<HTMLButtonElement | null>(null)

  const {
    showVariablesInHover,
    showDocsInHover,
    autoCompile,
    toggleShowVariablesInHover,
    toggleShowDocsInHover,
    toggleAutoCompile,
  } = hooks

  const handleSettingsKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      switch (event.key) {
        case "Escape": {
          setIsOpen(false)
          settingsButtonRef.current?.focus()
          break
        }
        case "ArrowDown": {
          event.preventDefault()
          const firstCheckbox: HTMLElement | null | undefined =
            settingsRef.current?.querySelector('input[type="checkbox"]')
          firstCheckbox?.focus()
          break
        }
      }
    },
    [setIsOpen],
  )

  const handleSettingsItemKeyDown = useCallback(
    (event: React.KeyboardEvent, action: () => void) => {
      switch (event.key) {
        case "Enter":
        case " ":
          event.preventDefault()
          action()
          break
        case "Escape":
          setIsOpen(false)
          settingsButtonRef.current?.focus()
          break
      }
    },
    [setIsOpen],
  )

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false)
        settingsButtonRef.current?.focus()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen, setIsOpen])

  return (
    <div className={styles.settingsContainer} ref={settingsRef}>
      <button
        type="button"
        className={styles.settingsButton}
        title="Settings"
        onClick={() => setIsOpen(!isOpen)}
        ref={settingsButtonRef}
        onKeyDown={event => handleSettingsKeyDown(event)}
        aria-label="Open settings menu"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-controls="settings-menu"
      >
        <FiSettings size={16} aria-hidden="true" />
      </button>
      {isOpen && (
        <div
          className={styles.settingsDropdown}
          role="menu"
          id="settings-menu"
          aria-label="Settings menu"
        >
          <label className={styles.settingsItem} aria-checked={showVariablesInHover}>
            <input
              type="checkbox"
              checked={showVariablesInHover}
              onChange={toggleShowVariablesInHover}
              onKeyDown={event => handleSettingsItemKeyDown(event, toggleShowVariablesInHover)}
              aria-describedby="vars-hover-desc"
              tabIndex={0}
            />
            <span className={styles.checkboxCustom} aria-hidden="true"></span>
            <span className={styles.checkboxLabel} id="vars-hover-desc">
              Show variables on hover
            </span>
          </label>
          <label className={styles.settingsItem} aria-checked={showDocsInHover}>
            <input
              type="checkbox"
              checked={showDocsInHover}
              onChange={toggleShowDocsInHover}
              onKeyDown={event => handleSettingsItemKeyDown(event, toggleShowDocsInHover)}
              aria-describedby="docs-hover-desc"
              tabIndex={0}
            />
            <span className={styles.checkboxCustom} aria-hidden="true"></span>
            <span className={styles.checkboxLabel} id="docs-hover-desc">
              Show instruction docs
            </span>
          </label>
          <label className={styles.settingsItem} aria-checked={autoCompile}>
            <input
              type="checkbox"
              checked={autoCompile}
              onChange={toggleAutoCompile}
              onKeyDown={event => handleSettingsItemKeyDown(event, toggleAutoCompile)}
              aria-describedby="auto-compile-desc"
              tabIndex={0}
            />
            <span className={styles.checkboxCustom} aria-hidden="true"></span>
            <span className={styles.checkboxLabel} id="auto-compile-desc">
              Auto-compile on change
            </span>
          </label>
        </div>
      )}
    </div>
  )
}

export default SettingsDropdown
