import {FiPlay} from "react-icons/fi"

import Button from "@shared/ui/Button"
import styles from "@app/pages/PlaygroundPage/PlaygroundPage.module.css"
import ButtonLoader from "@shared/ui/ButtonLoader/ButtonLoader.tsx"

export function ExecuteButton(props: {onClick: () => undefined; disabled: boolean}) {
  return (
    <Button
      onClick={props.onClick}
      disabled={props.disabled}
      className={styles.executeButton}
      title={
        props.disabled ? "Executing Assembly Code..." : "Execute Assembly Code (Ctrl/Cmd+Enter)"
      }
      aria-label={props.disabled ? "Executing assembly code..." : "Execute assembly code"}
      aria-describedby="execution-status"
      aria-keyshortcuts="Control+Enter"
    >
      {props.disabled ? (
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
