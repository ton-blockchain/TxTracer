import {Suspense, type ReactNode} from "react"

import ErrorBanner from "@shared/ui/ErrorBanner/ErrorBanner"
import FullScreenLoader from "@shared/ui/FullScreenLoader/FullScreenLoader"

import {useGlobalError} from "@shared/lib/errorContext"
import {ThemeToggleButton} from "@features/themeSwitcher/ui/ThemeToggleButton"

import {ErrorBoundary} from "./ErrorBoundary"

interface PageWrapperProps {
  readonly children: ReactNode
  readonly loadingMessage?: string
}

export function PageWrapper({children, loadingMessage = "Loading..."}: PageWrapperProps) {
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
        <Suspense fallback={<FullScreenLoader baseMessage={loadingMessage} />}>{children}</Suspense>
      </ErrorBoundary>

      <ThemeToggleButton />
    </main>
  )
}
