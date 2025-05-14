import React, {createContext, useContext, useState} from "react"

export interface GlobalErrorContextValue {
  readonly error: string | null
  readonly setError: (message: string) => void
  readonly clearError: () => void
}

const GlobalErrorContext = createContext<GlobalErrorContextValue | undefined>(undefined)

export const GlobalErrorProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const [error, setErrorState] = useState<string | null>(null)

  const setError = (message: string) => setErrorState(message)
  const clearError = () => setErrorState(null)

  return (
    <GlobalErrorContext.Provider value={{error, setError, clearError}}>
      {children}
    </GlobalErrorContext.Provider>
  )
}

export function useGlobalError(): GlobalErrorContextValue {
  const ctx = useContext(GlobalErrorContext)
  if (!ctx) {
    throw new Error("useGlobalError must be used within GlobalErrorProvider")
  }
  return ctx
}
