import React, {useRef, useCallback, useEffect, useState} from "react"
import {FiSettings} from "react-icons/fi"

import type {PlaygroundSettingsHook} from "@app/pages/PlaygroundPage/hooks/usePlaygroundSettings"

import styles from "@app/pages/GodboltPage/GodboltPage.module.css"

interface SettingsDropdownProps {
  readonly hooks: PlaygroundSettingsHook
}

export const SettingsDropdown: React.FC<SettingsDropdownProps> = ({hooks}) => {
  const [isOpen, setIsOpen] = useState(false)
  const settingsRef = useRef<HTMLDivElement | null>(null)
  const settingsButtonRef = useRef<HTMLButtonElement | null>(null)

  const {showMappingHighlight, toggleShowMappingHighlight} = hooks

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
        data-testid="settings-button"
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
          <label className={styles.settingsItem} aria-checked={showMappingHighlight}>
            <input
              type="checkbox"
              checked={showMappingHighlight}
              onChange={toggleShowMappingHighlight}
              onKeyDown={event => handleSettingsItemKeyDown(event, toggleShowMappingHighlight)}
              aria-describedby="mapping-highlight-desc"
              tabIndex={0}
            />
            <span className={styles.checkboxCustom} aria-hidden="true"></span>
            <span className={styles.checkboxLabel} id="mapping-highlight-desc">
              Show color mapping
            </span>
          </label>
        </div>
      )}
    </div>
  )
}

export default SettingsDropdown
