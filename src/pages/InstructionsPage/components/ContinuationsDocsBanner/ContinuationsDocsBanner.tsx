import React from "react"
import {FiBookOpen} from "react-icons/fi"

import styles from "./ContinuationsDocsBanner.module.css"

const ContinuationsDocsBanner: React.FC = () => {
  return (
    <div className={styles.compactBanner} role="note" aria-label="Documentation suggestion">
      <div className={styles.compactContent}>
        <FiBookOpen size={14} aria-hidden="true" />
        <a
          href="/spec/doc/book/continuations/basics-register-c0-cc-savelist-if-instruction/"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.labelLink}
        >
          Learn more about continuations
        </a>
      </div>
    </div>
  )
}

export default ContinuationsDocsBanner
