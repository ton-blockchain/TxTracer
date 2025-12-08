import React from "react"
import {createRoot} from "react-dom/client"
import {HelmetProvider} from "react-helmet-async"

import "../../index.css"

import {GlobalErrorProvider} from "@shared/lib/errorContext"
import {ThemeProvider} from "@shared/lib/themeContext"
import {PageWrapper} from "@app/app/PageWrapper"

import EmulatePage from "./EmulatePage.tsx"

const root = document.getElementById("root")
if (root === null) {
  throw new Error("Root element not found")
}

createRoot(root).render(
  <React.StrictMode>
    <GlobalErrorProvider>
      <ThemeProvider>
        <HelmetProvider>
          <PageWrapper loadingMessage="Loading Emulate page...">
            <EmulatePage />
          </PageWrapper>
        </HelmetProvider>
      </ThemeProvider>
    </GlobalErrorProvider>
  </React.StrictMode>,
)
