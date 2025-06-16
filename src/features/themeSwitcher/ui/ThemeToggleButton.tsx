import React from "react"

import {useTheme} from "@shared/lib/useTheme"
import Button from "@shared/ui/Button"
import Icon from "@shared/ui/Icon"
import MoonIcon from "@shared/ui/Icon/MoonIcon"
import SunIcon from "@shared/ui/Icon/SunIcon"

import styles from "./ThemeToggleButton.module.css"

export const ThemeToggleButton: React.FC = () => {
  const {theme, toggleTheme} = useTheme()

  return (
    <Button
      onClick={toggleTheme}
      variant="outline"
      className={styles.themeToggleButton}
      aria-label={theme === "light" ? "Switch to dark theme" : "Switch to light theme"}
    >
      {theme === "light" ? (
        <Icon svg={<MoonIcon />} size={18} />
      ) : (
        <Icon svg={<SunIcon />} size={18} />
      )}
      <span className={styles.toggleButtonText}>{theme === "light" ? "Dark" : "Light"} Mode</span>
    </Button>
  )
}
