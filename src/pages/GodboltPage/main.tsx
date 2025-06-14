import React, {Suspense} from "react"
import ReactDOM from "react-dom/client"
import {HelmetProvider} from "react-helmet-async"

import "../../index.css"

import ErrorBanner from "@shared/ui/ErrorBanner/ErrorBanner"
import FullScreenLoader from "@shared/ui/FullScreenLoader/FullScreenLoader"

import {GlobalErrorProvider, useGlobalError} from "@shared/lib/errorContext"
import {ThemeProvider} from "@shared/lib/themeContext"
import {ThemeToggleButton} from "@features/themeSwitcher/ui/ThemeToggleButton"

import {ErrorBoundary} from "../../app/ErrorBoundary"

import GodboltPage from "./GodboltPage"

function App() {
  const {error, clearError, setError} = useGlobalError()

  return (
    <main>
      {error && <ErrorBanner message={error} onClose={clearError} />}

      <ErrorBoundary
        resetKey={error}
        onError={err => {
          if (err instanceof Error) {
            setError(err.message)
          } else {
            setError("Unknown error")
          }
        }}
      >
        <Suspense fallback={<FullScreenLoader baseMessage="Loading Godbolt Playground..." />}>
          <GodboltPage />
        </Suspense>
      </ErrorBoundary>

      <ThemeToggleButton />
    </main>
  )
}

// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <GlobalErrorProvider>
      <ThemeProvider>
        <HelmetProvider>
          <App />
        </HelmetProvider>
      </ThemeProvider>
    </GlobalErrorProvider>
  </React.StrictMode>,
)
