import React from "react"

import SettingsDropdownShared, {
  type SettingsItem,
} from "@shared/ui/SettingsDropdown/SettingsDropdown.tsx"

import {type GodboltSettingsHook} from "../hooks/useGodboltSettings"

import styles from "../GodboltPage.module.css"

interface SettingsDropdownProps {
  readonly hooks: GodboltSettingsHook
}

export const SettingsDropdown: React.FC<SettingsDropdownProps> = ({hooks}) => {
  const items: readonly SettingsItem[] = [
    {
      id: "vars-hover",
      label: "Show variables on hover",
      checked: hooks.showVariablesInHover,
      onToggle: hooks.toggleShowVariablesInHover,
    },
    {
      id: "docs-hover",
      label: "Show instruction docs",
      checked: hooks.showDocsInHover,
      onToggle: hooks.toggleShowDocsInHover,
    },
    {
      id: "auto-compile",
      label: "Auto-compile on change",
      checked: hooks.autoCompile,
      onToggle: hooks.toggleAutoCompile,
    },
  ]

  return (
    <div className={styles.settingsContainer}>
      <SettingsDropdownShared items={items} />
    </div>
  )
}

export default SettingsDropdown
