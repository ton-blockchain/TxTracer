import {Suspense} from "react"

import {useGlobalError} from "@shared/lib/errorContext.tsx"
import ErrorBanner from "@shared/ui/ErrorBanner/ErrorBanner.tsx"
import {ErrorBoundary} from "@app/app/ErrorBoundary.tsx"
import FullScreenLoader from "@shared/ui/FullScreenLoader/FullScreenLoader.tsx"
import TracePage from "@app/pages/TracePage/TracePage.tsx"
import {ThemeToggleButton} from "@features/themeSwitcher/ui/ThemeToggleButton.tsx"

export function App() {
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
        <Suspense fallback={<FullScreenLoader baseMessage="Loading TxTracer..." />}>
          <TracePage />
        </Suspense>
      </ErrorBoundary>

      <ThemeToggleButton />
    </main>
  )
}
