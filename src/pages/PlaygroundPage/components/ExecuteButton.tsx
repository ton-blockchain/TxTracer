import {FiPlay} from "react-icons/fi"

import Button from "@shared/ui/Button"
import styles from "@app/pages/PlaygroundPage/PlaygroundPage.module.css"
import ButtonLoader from "@shared/ui/ButtonLoader/ButtonLoader.tsx"

interface ExecuteButtonProps {
  readonly onClick: () => undefined
  readonly loading: boolean
}

export function ExecuteButton({onClick, loading}: ExecuteButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={loading}
      className={styles.executeButton}
      title={loading ? "Executing Assembly Code..." : "Execute Assembly Code (Ctrl/Cmd+Enter)"}
      aria-label={loading ? "Executing assembly code..." : "Execute assembly code"}
      aria-describedby="execution-status"
      aria-keyshortcuts="Control+Enter"
    >
      {loading ? (
        <ButtonLoader>Execute</ButtonLoader>
      ) : (
        <>
          <FiPlay size={16} aria-hidden="true" />
          Execute
        </>
      )}
    </Button>
  )
}
