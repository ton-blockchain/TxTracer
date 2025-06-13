import React, {Suspense} from "react"
import {BrowserRouter, Routes, Route, Navigate} from "react-router-dom"
import {HelmetProvider} from "react-helmet-async"

import ErrorBanner from "@shared/ui/ErrorBanner/ErrorBanner"
import FullScreenLoader from "@shared/ui/FullScreenLoader/FullScreenLoader"

import {GlobalErrorProvider, useGlobalError} from "@shared/lib/errorContext"
import {ThemeProvider} from "@shared/lib/themeContext"

import {ThemeToggleButton} from "@features/themeSwitcher/ui/ThemeToggleButton"

import {ErrorBoundary} from "./app/ErrorBoundary"
import PageMetadata from "./app/PageMetadata"

const TracePage = React.lazy(() => import("./pages/TracePage/TracePage"))
const PlaygroundPage = React.lazy(() => import("./pages/PlaygroundPage/PlaygroundPage"))
const GodboltPage = React.lazy(() => import("./pages/GodboltPage/GodboltPage"))

function AppShell() {
  const {error, clearError, setError} = useGlobalError()

  return (
    <main>
      {error && <ErrorBanner message={error} onClose={clearError} />}

      <BrowserRouter>
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
          <Routes>
            <Route
              path="/"
              element={
                <Suspense fallback={<FullScreenLoader baseMessage="Loading TxTracer..." />}>
                  <PageMetadata
                    title="Transaction Tracer"
                    description="TxTracer is a web app for tracing and analyzing TON blockchain transactions. It offers tools to visualize execution, inspect contracts, and debug smart contracts with a code editor and user-friendly interface."
                    imageUrl="/assets/cover.png"
                  />
                  <TracePage />
                </Suspense>
              }
            />
            <Route
              path="/play"
              element={
                <Suspense fallback={<FullScreenLoader baseMessage="Loading Playground..." />}>
                  <PageMetadata
                    title="Playground"
                    description="Experiment with TASM (TVM Assembly) in an interactive playground. Write, compile, and test  assembly code."
                    imageUrl="/assets/playground-cover.png"
                  />
                  <PlaygroundPage />
                </Suspense>
              }
            />
            <Route
              path="/code-explorer"
              element={
                <Suspense
                  fallback={<FullScreenLoader baseMessage="Loading Godbolt Playground..." />}
                >
                  <PageMetadata
                    title="Code Explorer"
                    description="Explore FunC and its compiled TASM assembly side-by-side. Understand how your FunC code translates to low-level instructions."
                    imageUrl="/assets/code-explorer-cover.png"
                  />
                  <GodboltPage />
                </Suspense>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ErrorBoundary>
      </BrowserRouter>

      <ThemeToggleButton />
    </main>
  )
}

export default function App() {
  return (
    <GlobalErrorProvider>
      <ThemeProvider>
        <HelmetProvider>
          <AppShell />
        </HelmetProvider>
      </ThemeProvider>
    </GlobalErrorProvider>
  )
}
