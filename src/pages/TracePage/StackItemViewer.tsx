import React from "react"
import type {StackElement} from "ton-assembly-test-dev/dist/trace"

import styles from "@app/pages/TracePage/StackItemViewer.module.css"
import StackItemDetails from "@shared/ui/StackItemDetails"

interface StackItemViewerProps {
  readonly element: StackElement
  readonly title: string
  readonly onBack: () => void
}

export const StackItemViewer: React.FC<StackItemViewerProps> = ({element, title, onBack}) => {
  return (
    <div className={styles.stackItemViewer}>
      <StackItemDetails itemData={element} title={title} onClose={onBack} />
    </div>
  )
}
