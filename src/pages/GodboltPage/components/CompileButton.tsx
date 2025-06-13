import React from "react"
import {FiPlay} from "react-icons/fi"

import Button from "@shared/ui/Button"
import ButtonLoader from "@shared/ui/ButtonLoader/ButtonLoader"

interface CompileButtonProps {
  readonly onCompile: () => void
  readonly loading: boolean
  readonly disabled?: boolean
  readonly className?: string
}

export const CompileButton: React.FC<CompileButtonProps> = ({
  onCompile,
  loading,
  disabled = false,
  className,
}) => {
  return (
    <Button
      onClick={onCompile}
      disabled={loading || disabled}
      className={className}
      title={loading ? "Compiling FunC code..." : "Compile FunC code to assembly (Ctrl/Cmd+Enter)"}
      aria-label={loading ? "Compiling code..." : "Compile FunC code"}
      aria-describedby="compile-status"
      aria-keyshortcuts="Control+Enter"
    >
      {loading ? (
        <ButtonLoader>Compile</ButtonLoader>
      ) : (
        <>
          <FiPlay size={16} aria-hidden="true" />
          Compile
        </>
      )}
    </Button>
  )
}

export default CompileButton
