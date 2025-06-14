import React from "react"
import ReactDOM from "react-dom/client"
import {HelmetProvider} from "react-helmet-async"

import "../../index.css"

import {GlobalErrorProvider} from "@shared/lib/errorContext"
import {ThemeProvider} from "@shared/lib/themeContext"
import {App} from "@app/pages/TracePage/App.tsx"

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
