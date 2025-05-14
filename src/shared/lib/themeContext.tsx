import React, {createContext, useContext, useState, useEffect, useCallback} from "react"

type Theme = "light" | "dark"

interface ThemeContextType {
  readonly theme: Theme
  readonly toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const ThemeProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const storedTheme = localStorage.getItem("app-theme") as Theme | null
    if (storedTheme) {
      return storedTheme
    }
    const prefersDark =
      window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
    if (prefersDark) {
      return "dark"
    }
    return "light"
  })

  useEffect(() => {
    if (theme === "dark") {
      document.body.classList.add("dark-theme")
    } else {
      document.body.classList.remove("dark-theme")
    }
    localStorage.setItem("app-theme", theme)
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme(prevTheme => (prevTheme === "light" ? "dark" : "light"))
  }, [])

  return <ThemeContext.Provider value={{theme, toggleTheme}}>{children}</ThemeContext.Provider>
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
