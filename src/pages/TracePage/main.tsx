import React from "react"
import {createRoot} from "react-dom/client"
import {HelmetProvider} from "react-helmet-async"

import "../../index.css"

import {GlobalErrorProvider} from "@shared/lib/errorContext"
import {ThemeProvider} from "@shared/lib/themeContext"
import {PageWrapper} from "@app/app/PageWrapper"

import TracePage from "./TracePage"

// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <GlobalErrorProvider>
      <ThemeProvider>
        <HelmetProvider>
          <PageWrapper loadingMessage="Loading TxTracer...">
            <TracePage />
          </PageWrapper>
        </HelmetProvider>
      </ThemeProvider>
    </GlobalErrorProvider>
  </React.StrictMode>,
)
