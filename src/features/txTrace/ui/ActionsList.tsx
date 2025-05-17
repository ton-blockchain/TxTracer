import React from "react"

import type {OutAction} from "@entities/transaction"
import {getActionSummary} from "@features/txTrace/lib/actions.ts"

import styles from "./ActionsList.module.css"

interface Props {
  readonly actions: readonly OutAction[]
  readonly onSelect: (idx: number) => void
}

const getActionIconStyle = (actionType: OutAction["type"]) => {
  switch (actionType) {
    case "sendMsg":
      return styles.actionCardIconSendMsg
    case "setCode":
      return styles.actionCardIconSetCode
    case "reserve":
      return styles.actionCardIconReserve
    case "changeLibrary":
      return styles.actionCardIconChangeLibrary
    default:
      return styles.actionCardIconUnknown
  }
}

const getActionCardStyle = (actionType: OutAction["type"]) => {
  switch (actionType) {
    case "sendMsg":
      return styles.actionSendMsg
    case "setCode":
      return styles.actionSetCode
    case "reserve":
      return styles.actionReserve
    case "changeLibrary":
      return styles.actionChangeLibrary
    default:
      return styles.actionUnknown
  }
}

const ActionsList: React.FC<Props> = ({actions, onSelect}) => {
  if (actions.length === 0) {
    return <p className={styles.noActions}>No out actions.</p>
  }
  return (
    <div className={styles.actionsHorizontalList}>
      {actions.map((action, index) => {
        const summary = getActionSummary(action)
        const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
          if (event.key === "Enter" || event.key === " ") {
            onSelect(index)
          }
        }
        const cardStyle = getActionCardStyle(action.type)
        const iconStyle = getActionIconStyle(action.type)

        return (
          <div
            key={index}
            className={cardStyle}
            onClick={() => onSelect(index)}
            onKeyDown={handleKeyDown}
            role="button"
            tabIndex={0}
          >
            <div className={styles.actionCardContent}>
              <div className={iconStyle}>
                {action.type === "sendMsg" && (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M22 2L11 13"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M22 2L15 22L11 13L2 9L22 2Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
                {action.type === "setCode" && (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M16 18L22 12L16 6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M8 6L2 12L8 18"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
                {action.type === "reserve" && (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 1V23"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
              <div className={styles.actionCardTitle}>{summary.title}</div>
              <div className={styles.actionCardDescription}>{summary.description}</div>
              {summary.value && <div className={styles.actionCardValue}>{summary.value}</div>}
            </div>
            <div className={styles.actionCardView}>
              <button className={styles.viewActionBtn}>
                View Details
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M15 12L9 8V16L15 12Z"
                    fill="currentColor"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
export default ActionsList
