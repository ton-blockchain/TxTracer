import React, {useEffect, useState} from "react"

import type {Instruction} from "@features/spec/tvm-specification.types"
import Button from "@shared/ui/Button"

import styles from "./ArithmeticCalculator.module.css"

interface ArithmeticCalculatorProps {
  readonly instruction: Instruction
  readonly instructionName: string
}

const ArithmeticCalculator: React.FC<ArithmeticCalculatorProps> = ({
  instruction,
  instructionName,
}) => {
  const [inputs, setInputs] = useState<string[]>([])
  const [result, setResult] = useState<string | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const stackInputs = instruction?.signature?.inputs?.stack ?? []
  const operands = instruction.operands || instruction.description.operands || []

  const allInputs = [
    ...stackInputs.map((stackInput, index) => ({
      type: "stack" as const,
      index,
      name: stackInput.type === "simple" ? stackInput.name : `arg ${index + 1}`,
      label: `Value of ${stackInput.type === "simple" ? stackInput.name : `${index + 1} argument`}`,
    })),
    ...operands.map((operand, index) => ({
      type: "operand" as const,
      index,
      name: operand || `operand ${index + 1}`,
      label: `Operand ${operand || `#${index + 1}`}`,
    })),
  ]

  const totalInputsCount = allInputs.length

  useEffect(() => {
    if (inputs.length === 0 && totalInputsCount > 0) {
      setInputs(new Array(totalInputsCount).fill("0"))
    }
  }, [totalInputsCount, inputs.length])

  const handleInputChange = (index: number, value: string) => {
    const newInputs = [...inputs]
    newInputs[index] = value
    setInputs(newInputs)
  }

  const calculateResult = async () => {
    setIsCalculating(true)
    setError(null)

    const executor = await import("@features/tasm/lib/executor")

    try {
      const stackValues: bigint[] = []
      const operandValues: number[] = []

      for (let i = 0; i < inputs.length; i++) {
        const input = inputs[i]
        const inputInfo = allInputs[i]

        if (inputInfo.type === "stack") {
          try {
            stackValues.push(BigInt(input.trim()))
          } catch {
            throw new Error(`Invalid stack value: ${input}`)
          }
        } else if (inputInfo.type === "operand") {
          try {
            const num = parseInt(input.trim(), 10)
            if (isNaN(num)) {
              throw new Error(`Invalid operand: ${input}`)
            }
            operandValues.push(num)
          } catch {
            throw new Error(`Invalid operand: ${input}`)
          }
        }
      }

      const instructionWithOperands =
        operandValues.length > 0 ? `${instructionName} ${operandValues.join(" ")}` : instructionName

      const program = [
        "DROP", // drop method id
        ...stackValues.map(value => `PUSHINT_LONG ${value}`),
        instructionWithOperands,
      ].join("\n")

      const executionResult = await executor.executeAssemblyCode(program)

      if (executionResult.stack && executionResult.stack.remaining > 0) {
        const resultValue = executionResult.stack.readBigNumber()
        setResult(resultValue.toString())
      } else if (executionResult.exitCode) {
        throw new Error(
          `Execution failed with exit code ${executionResult.exitCode.num}: ${executionResult.exitCode.description}`,
        )
      } else {
        throw new Error("Execution completed but no result on stack")
      }
    } catch (err) {
      setResult(null)
      if (err instanceof executor.TasmCompilationError) {
        setError(`Compilation error: ${err.message}`)
      } else {
        setError(err instanceof Error ? err.message : "Unknown error occurred")
      }
    } finally {
      setIsCalculating(false)
    }
  }

  const isCalculateDisabled = inputs.some(input => input.trim() === "") || isCalculating

  return (
    <div className={styles.calculator}>
      <div className={styles.inputs}>
        {allInputs.map((inputInfo, index) => (
          <div key={index} className={styles.inputGroup}>
            <label className={styles.label}>
              <span className={styles.labelText}>
                <code>{inputInfo.name}</code>:
              </span>
              <input
                type="text"
                value={inputs[index] || ""}
                onChange={e => handleInputChange(index, e.target.value)}
                placeholder={"Enter integer"}
                className={styles.input}
                disabled={isCalculating}
              />
            </label>
          </div>
        ))}
      </div>

      <div className={styles.actions}>
        <Button
          onClick={() => {
            void calculateResult()
          }}
          disabled={isCalculateDisabled}
          variant="primary"
          size="sm"
        >
          Calculate
        </Button>
      </div>

      {error && (
        <div className={styles.error}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && (
        <div className={styles.result}>
          <strong>Result:</strong> <span className={styles.resultValue}>{result}</span>
        </div>
      )}
    </div>
  )
}

export default ArithmeticCalculator
