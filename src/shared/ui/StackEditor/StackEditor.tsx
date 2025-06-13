import React, {useState, useCallback, type JSX} from "react"
import {FiPlus, FiTrash2, FiArrowUp, FiArrowDown, FiFileText, FiCheck} from "react-icons/fi"
import {type StackElement} from "ton-assembly-test-dev/dist/trace"
import {logs} from "ton-assembly-test-dev/dist"
import {Cell} from "@ton/core"
import {motion, AnimatePresence} from "framer-motion"

import Button from "@shared/ui/Button"
import {CopyButton} from "@shared/CopyButton/CopyButton.tsx"

import styles from "./StackEditor.module.css"

export interface StackEditorProps {
  readonly stack: StackElement[]
  readonly onStackChange: (stack: StackElement[]) => void
}

interface StackItemForm {
  readonly type: "Integer" | "Cell" | "Slice" | "Null"
  readonly value: string
}

const truncateMiddle = (text: string, maxLength: number = 30): JSX.Element => {
  if (text.length <= maxLength) return <>{text}</>

  const partLength = Math.floor(maxLength / 2)
  const start = text.substring(0, partLength)
  const end = text.substring(text.length - partLength)

  return (
    <span title={text} className={styles.truncatedMiddle}>
      {start}
      <span className={styles.ellipsis}>…</span>
      {end}
    </span>
  )
}

const getElementKey = (element: StackElement, index: number): string => {
  switch (element.$) {
    case "Integer":
      return `int-${element.value}-${index}`
    case "Cell":
      return `cell-${element.boc}-${index}`
    case "Slice":
      return `slice-${element.hex}-${element.startBit}-${element.startRef}-${index}`
    case "Builder":
      return `builder-${element.hex}-${index}`
    case "Continuation":
      return `cont-${element.name}-${index}`
    case "Address":
      return `addr-${element.value}-${index}`
    case "Tuple":
      return `tuple-${index}`
    case "Null":
      return `null-${index}`
    case "NaN":
      return `nan-${index}`
    case "Unknown":
      return `unknown-${index}`
    default:
      return `unknown-fallback-${index}`
  }
}

const safeCellFromHex = (boc: string) => {
  try {
    return Cell.fromHex(boc)
  } catch {
    return new Cell()
  }
}

const StackEditor: React.FC<StackEditorProps> = ({stack, onStackChange}) => {
  const [newItem, setNewItem] = useState<StackItemForm>({type: "Integer", value: ""})
  const [expandedItem, setExpandedItem] = useState<string | null>(null)
  const [showTextImport, setShowTextImport] = useState(false)
  const [textStackInput, setTextStackInput] = useState("")
  const [parseError, setParseError] = useState<string | null>(null)

  const toggleExpand = (key: string) => {
    setExpandedItem(prev => (prev === key ? null : key))
  }

  const addStackItem = useCallback(() => {
    if (newItem.type !== "Null" && !newItem.value.trim()) {
      return
    }

    let stackElement: StackElement

    try {
      switch (newItem.type) {
        case "Integer":
          stackElement = {
            $: "Integer",
            value: BigInt(newItem.value),
          }
          break
        case "Cell":
          // Validate BoC hex
          Cell.fromHex(newItem.value)
          stackElement = {
            $: "Cell",
            boc: newItem.value,
          }
          break
        case "Slice":
          stackElement = {
            $: "Slice",
            hex: newItem.value,
            startBit: 0,
            endBit: 0,
            startRef: 0,
            endRef: 0,
          }
          break
        case "Null":
          stackElement = {
            $: "Null",
          }
          break
        default:
          return
      }

      onStackChange([stackElement, ...(Array.isArray(stack) ? stack : [])])
      setNewItem({type: "Integer", value: ""})
    } catch (error) {
      console.error("Invalid stack item:", error)
    }
  }, [newItem, stack, onStackChange])

  const removeStackItem = useCallback(
    (originalIndex: number) => {
      if (!Array.isArray(stack)) return
      // Convert originalIndex back to actual array index
      const actualIndex = stack.length - 1 - originalIndex
      const newStack = stack.filter((_, i) => i !== actualIndex)
      onStackChange(newStack)
    },
    [stack, onStackChange],
  )

  const moveStackItem = useCallback(
    (originalIndex: number, direction: "up" | "down") => {
      if (!Array.isArray(stack)) return
      const newStack = [...stack]
      // Convert originalIndex back to actual array index
      const actualIndex = stack.length - 1 - originalIndex
      // "up" means towards stack top (smaller originalIndex, larger actualIndex)
      // "down" means towards stack bottom (larger originalIndex, smaller actualIndex)
      const targetIndex = direction === "up" ? actualIndex + 1 : actualIndex - 1

      if (targetIndex >= 0 && targetIndex < newStack.length) {
        ;[newStack[actualIndex], newStack[targetIndex]] = [
          newStack[targetIndex],
          newStack[actualIndex],
        ]
        onStackChange(newStack)
      }
    },
    [stack, onStackChange],
  )

  const clearStack = useCallback(() => {
    onStackChange([])
  }, [onStackChange])

  const parseTextStack = useCallback(() => {
    if (!textStackInput.trim()) {
      setParseError("Please enter stack text")
      return
    }

    try {
      setParseError(null)
      const parsed = logs.parseStack(textStackInput.trim())
      if (!parsed) {
        setParseError("Could not parse stack text")
        return
      }

      const stackElements = logs.processStack(parsed)
      if (!Array.isArray(stackElements)) {
        setParseError("Invalid stack format")
        return
      }

      onStackChange(stackElements)
      setTextStackInput("")
      setShowTextImport(false)
    } catch (error) {
      setParseError(error instanceof Error ? error.message : "Parse error")
    }
  }, [textStackInput, onStackChange])

  const renderStackElement = (
    element: StackElement,
    keyPrefix: string,
    originalIndex: number,
  ): JSX.Element => {
    const handleItemClick = () => {
      toggleExpand(keyPrefix)
    }

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        handleItemClick()
      }
    }

    switch (element.$) {
      case "Null":
        return (
          <div className={styles.nullItem} key={keyPrefix}>
            null
          </div>
        )
      case "NaN":
        return (
          <div className={styles.nanItem} key={keyPrefix}>
            NaN
          </div>
        )
      case "Integer": {
        const value = element.value.toString()
        return (
          <div className={styles.integerItem} key={keyPrefix}>
            {value}
            <CopyButton
              className={styles.integerItemCopyButton}
              title="Copy integer value"
              value={value.toString()}
            />
          </div>
        )
      }
      case "Cell": {
        const cell = safeCellFromHex(element.boc)
        return (
          <div
            className={styles.cellItem}
            key={keyPrefix}
            onClick={handleItemClick}
            onKeyDown={handleKeyDown}
            role="button"
            tabIndex={0}
          >
            <div className={styles.stackItemLabel}>Cell</div>
            <div className={styles.stackItemValue}>
              {cell.bits.length === 0 && cell.refs.length === 0
                ? "Empty Cell"
                : expandedItem === keyPrefix
                  ? element.boc
                  : truncateMiddle(element.boc, 40)}
              <div className={styles.stackItemDetails}>
                Bits: {cell.bits.length}, Refs: {cell.refs.length}
              </div>
              <CopyButton
                className={styles.cellItemCopyButton}
                title="Copy cell as BoC"
                value={element.boc}
              />
            </div>
          </div>
        )
      }
      case "Slice": {
        const cell = safeCellFromHex(element.hex)
        return (
          <div
            className={styles.sliceItem}
            key={keyPrefix}
            onClick={handleItemClick}
            onKeyDown={handleKeyDown}
            role="button"
            tabIndex={0}
          >
            <div className={styles.stackItemLabel}>Slice</div>
            <div className={styles.stackItemValue}>
              {cell.bits.length === 0 && cell.refs.length === 0
                ? "Empty Slice"
                : expandedItem === keyPrefix
                  ? element.hex
                  : truncateMiddle(element.hex, 40)}
              <CopyButton
                className={styles.sliceItemCopyButton}
                title="Copy slice as BoC"
                value={element.hex}
              />
            </div>
            <div className={styles.stackItemDetails}>
              Bits: {element.startBit}-{element.endBit}, Refs: {element.startRef}-{element.endRef}
            </div>
          </div>
        )
      }
      case "Builder": {
        const cell = safeCellFromHex(element.hex)
        return (
          <div
            className={styles.builderItem}
            key={keyPrefix}
            onClick={handleItemClick}
            onKeyDown={handleKeyDown}
            role="button"
            tabIndex={0}
          >
            <div className={styles.stackItemLabel}>Builder</div>
            <div className={styles.stackItemValue}>
              {cell.bits.length === 0 && cell.refs.length === 0
                ? "Empty Builder"
                : expandedItem === keyPrefix
                  ? element.hex
                  : truncateMiddle(element.hex, 40)}
            </div>
            <div className={styles.stackItemDetails}>
              Bits: {cell.bits.length}, Refs: {cell.refs.length}
            </div>
            <CopyButton
              className={styles.builderItemCopyButton}
              title="Copy builder as BoC"
              value={element.hex}
            />
          </div>
        )
      }
      case "Continuation": {
        return (
          <div
            className={styles.continuationItem}
            key={keyPrefix}
            onClick={() => toggleExpand(keyPrefix)}
            onKeyDown={e => {
              if (e.key === "Enter" || e.key === " ") toggleExpand(keyPrefix)
            }}
            role="button"
            tabIndex={0}
          >
            <div className={styles.stackItemLabel}>Continuation</div>
            <div className={styles.stackItemValue}>
              {expandedItem === keyPrefix ? element.name : truncateMiddle(element.name, 40)}
            </div>
            <CopyButton
              className={styles.continuationItemCopyButton}
              title="Copy continuation"
              value={element.name}
            />
          </div>
        )
      }
      case "Address": {
        return (
          <div
            className={styles.addressItem}
            key={keyPrefix}
            onClick={handleItemClick}
            onKeyDown={handleKeyDown}
            role="button"
            tabIndex={0}
          >
            <div className={styles.stackItemLabel}>Address</div>
            <div className={styles.stackItemValue}>
              {expandedItem === keyPrefix ? element.value : truncateMiddle(element.value, 40)}
            </div>
            <CopyButton
              className={styles.addressItemCopyButton}
              title="Copy address as base64"
              value={element.value}
            />
          </div>
        )
      }
      case "Tuple":
        return (
          <div className={styles.tupleItem} key={keyPrefix}>
            <div className={styles.stackItemLabel}>Tuple</div>
            <div className={styles.stackItems}>
              {element.elements.map((el, i) => {
                const nestedKeyPrefix = `${keyPrefix}-${i}`
                return (
                  <div className={styles.tupleElement} key={nestedKeyPrefix}>
                    {renderStackElement(el, nestedKeyPrefix, originalIndex)}
                  </div>
                )
              })}
            </div>
          </div>
        )
      case "Unknown":
        return (
          <div className={styles.unknownItem} key={keyPrefix} role="button" tabIndex={0}>
            <div className={styles.stackItemLabel}>Unknown</div>
            <div className={styles.stackItemValue}>
              {expandedItem === keyPrefix ? element.value : truncateMiddle(element.value, 40)}
            </div>
          </div>
        )
      default:
        return (
          <div className={styles.stackItem} key={keyPrefix}>
            Unknown element type
          </div>
        )
    }
  }

  const itemVariants = {
    initial: {opacity: 0, y: 20},
    animate: {opacity: 1, y: 0},
    exit: {opacity: 0, y: -20},
  }

  const itemsToRender = Array.isArray(stack)
    ? stack.map((el, index) => ({
        element: el,
        key: getElementKey(el, index),
        originalIndex: stack.length - 1 - index,
      }))
    : []

  return (
    <div className={styles.stackEditor}>
      <div className={styles.stackContainer}>
        <div className={styles.stackHeader}>
          <h4>Initial Stack</h4>
          <div className={styles.stackHeaderActions}>
            <Button
              className={styles.stackButton}
              variant="ghost"
              size="sm"
              onClick={() => setShowTextImport(!showTextImport)}
              title="Import from text"
            >
              <FiFileText size={16} />
              Import
            </Button>
            <Button
              className={styles.stackButton}
              variant="ghost"
              size="sm"
              onClick={clearStack}
              disabled={!Array.isArray(stack) || stack.length === 0}
            >
              Clear All
            </Button>
          </div>
        </div>

        {showTextImport && (
          <div className={styles.textImportSection}>
            <textarea
              value={textStackInput}
              onChange={e => setTextStackInput(e.target.value)}
              placeholder="Paste stack text from logs (e.g., [ 42 CS{...} ])"
              className={styles.textImportInput}
              rows={3}
            />
            {parseError && <div className={styles.parseError}>{parseError}</div>}
            <div className={styles.textImportActions}>
              <Button
                className={styles.applyStackButton}
                onClick={parseTextStack}
                disabled={!textStackInput.trim()}
              >
                <FiCheck size={16} />
                Apply Stack
              </Button>
              <Button
                className={styles.stackButton}
                variant="ghost"
                onClick={() => setShowTextImport(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {!Array.isArray(stack) || stack.length === 0 ? (
          <div className={styles.emptyStack}>Empty stack</div>
        ) : (
          <div className={styles.stackItems}>
            <AnimatePresence mode="popLayout">
              {[...itemsToRender].reverse().map(({element, key, originalIndex}) => (
                <motion.div
                  key={key}
                  layout
                  variants={itemVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{type: "spring", stiffness: 300, damping: 30}}
                  className={styles.stackElement}
                >
                  <div className={styles.stackIndex}>{originalIndex}</div>
                  <div className={styles.stackItemContainer}>
                    {renderStackElement(element, key, originalIndex)}
                  </div>
                  <div className={styles.stackItemActions}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveStackItem(originalIndex, "up")}
                      disabled={!Array.isArray(stack) || originalIndex === 0}
                      title="Move up"
                    >
                      <FiArrowUp size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveStackItem(originalIndex, "down")}
                      disabled={!Array.isArray(stack) || originalIndex === stack.length - 1}
                      title="Move down"
                    >
                      <FiArrowDown size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeStackItem(originalIndex)}
                      title="Remove"
                    >
                      <FiTrash2 size={14} />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <div className={styles.addItemForm}>
        <div className={styles.compactFormRow}>
          <select
            value={newItem.type}
            onChange={e => setNewItem({...newItem, type: e.target.value as StackItemForm["type"]})}
            className={styles.typeSelect}
          >
            <option value="Integer">Integer</option>
            <option value="Cell">Cell</option>
            <option value="Slice">Slice</option>
            <option value="Null">Null</option>
          </select>

          {newItem.type !== "Null" && (
            <input
              type="text"
              value={newItem.value}
              onChange={e => setNewItem({...newItem, value: e.target.value})}
              placeholder={
                newItem.type === "Integer"
                  ? "42, -100"
                  : newItem.type === "Cell"
                    ? "BoC hex"
                    : "hex data"
              }
              className={styles.valueInput}
            />
          )}

          <Button
            onClick={addStackItem}
            disabled={!newItem.value.trim() && newItem.type !== "Null"}
            size="sm"
          >
            <FiPlus size={14} />
          </Button>
        </div>
      </div>
    </div>
  )
}

export default React.memo(StackEditor)
