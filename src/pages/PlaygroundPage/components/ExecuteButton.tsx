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
      title="Execute Assembly Code"
    >
      {props.disabled ? (
        <ButtonLoader>Execute</ButtonLoader>
      ) : (
        <>
          <FiPlay size={16} />
          Execute
        </>
      )}
    </Button>
  )
}
