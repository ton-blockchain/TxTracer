import React from "react"
import {createRoot} from "react-dom/client"
import {HelmetProvider} from "react-helmet-async"

import "../../index.css"

import {GlobalErrorProvider} from "@shared/lib/errorContext"
import {ThemeProvider} from "@shared/lib/themeContext"
import {PageWrapper} from "@app/app/PageWrapper"

import SandboxPage from "./SandboxPage.tsx"

// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <GlobalErrorProvider>
      <ThemeProvider>
        <HelmetProvider>
          <PageWrapper loadingMessage="Loading Sandbox page...">
            <SandboxPage />
          </PageWrapper>
        </HelmetProvider>
      </ThemeProvider>
    </GlobalErrorProvider>
  </React.StrictMode>,
)
