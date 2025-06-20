import React from "react"

import {type Address} from "@ton/core"

import Modal from "@shared/ui/Modal"
import type {MessageRelaxed, OutAction, StateInit} from "@entities/transaction"
import {formatAddress, formatBoolean, formatCurrency, formatNumber} from "@shared/lib/format"
import AddressChip from "@shared/ui/AddressChip"
import Icon from "@shared/ui/Icon"

import styles from "./ActionModal.module.css"

const renderMessageInfoDetails = (info: MessageRelaxed["info"], contractAddress: Address) => {
  if (!info) return null
  const sourceAddress = info.src ?? contractAddress // sandbox returns src=null, manually set it here for now
  return (
    <>
      <div className={styles.detailRow}>
        <div className={styles.detailLabel}>Type:</div>
        <div className={styles.detailValue}>{info.type}</div>
      </div>
      {info.type === "internal" && (
        <>
          <div className={styles.detailRow}>
            <div className={styles.detailLabel}>Source:</div>
            <div className={styles.detailValue}>
              {sourceAddress ? <AddressChip address={formatAddress(sourceAddress)} /> : "unknown"}
            </div>
          </div>
          <div className={styles.detailRow}>
            <div className={styles.detailLabel}>Destination:</div>
            <div className={styles.detailValue}>
              <AddressChip address={formatAddress(info.dest)} />
            </div>
          </div>
          <div className={styles.detailRow}>
            <div className={styles.detailLabel}>Value:</div>
            <div className={styles.detailValue}>{formatCurrency(info.value.coins)}</div>
          </div>
          {info.value.other && Object.keys(info.value.other).length > 0 && (
            <div className={styles.detailRow}>
              <div className={styles.detailLabel}>Other Currencies:</div>
              <div className={styles.detailValue}>
                <pre>{JSON.stringify(info.value.other, null, 2)}</pre>
              </div>
            </div>
          )}
          <div className={styles.detailRow}>
            <div className={styles.detailLabel}>Forward Fee:</div>
            <div className={styles.detailValue}>{formatCurrency(info.forwardFee)}</div>
          </div>
          <div className={styles.detailRow}>
            <div className={styles.detailLabel}>IHR Fee:</div>
            <div className={styles.detailValue}>{formatCurrency(info.ihrFee)}</div>
          </div>
          <div className={styles.detailRow}>
            <div className={styles.detailLabel}>Bounce:</div>
            <div className={styles.detailValue}>{formatBoolean(info.bounce)}</div>
          </div>
          <div className={styles.detailRow}>
            <div className={styles.detailLabel}>Bounced:</div>
            <div className={styles.detailValue}>{formatBoolean(info.bounced)}</div>
          </div>
          <div className={styles.detailRow}>
            <div className={styles.detailLabel}>IHR Disabled:</div>
            <div className={styles.detailValue}>{formatBoolean(info.ihrDisabled)}</div>
          </div>
        </>
      )}
      {info.type === "external-out" && (
        <>
          <div className={styles.detailRow}>
            <div className={styles.detailLabel}>Source:</div>
            <div className={styles.detailValue}>
              {sourceAddress ? <AddressChip address={formatAddress(sourceAddress)} /> : "unknown"}
            </div>
          </div>
          <div className={styles.detailRow}>
            <div className={styles.detailLabel}>Destination:</div>
            <div className={styles.detailValue}>
              {info.dest ? <AddressChip address={formatAddress(info.dest)} /> : "unknown"}
            </div>
          </div>
        </>
      )}
      <div className={styles.detailRow}>
        <div className={styles.detailLabel}>Created LT:</div>
        <div className={styles.detailValue}>{formatNumber(info.createdLt)}</div>
      </div>
      <div className={styles.detailRow}>
        <div className={styles.detailLabel}>Created At:</div>
        <div className={styles.detailValue}>{info.createdAt}</div>
      </div>
    </>
  )
}

const renderStateInitDetails = (stateInit: StateInit | undefined | null) => {
  if (!stateInit)
    return (
      <div className={styles.detailRow}>
        <div className={styles.detailLabel}>State Init:</div>
        <div className={styles.detailValue}>Not present</div>
      </div>
    )
  return (
    <div className={styles.actionDetailSection}>
      <h4>State Init</h4>
      {stateInit.code && (
        <div className={styles.detailRow}>
          <div className={styles.detailLabel}>Code Hash:</div>
          <div className={styles.detailValue}>{stateInit.code.hash().toString("hex")}</div>
        </div>
      )}
      {stateInit.data && (
        <div className={styles.detailRow}>
          <div className={styles.detailLabel}>Data Hash:</div>
          <div className={styles.detailValue}>{stateInit.data.hash().toString("hex")}</div>
        </div>
      )}
      {stateInit.splitDepth !== undefined && (
        <div className={styles.detailRow}>
          <div className={styles.detailLabel}>Split Depth:</div>
          <div className={styles.detailValue}>{formatNumber(stateInit.splitDepth)}</div>
        </div>
      )}
    </div>
  )
}

const renderActionDetails = (action: OutAction, contractAddress: Address) => {
  switch (action.type) {
    case "sendMsg": {
      return (
        <div className={styles.actionDetailsContent}>
          {/* Section: General Info */}
          <div className={styles.detailRow}>
            <div className={styles.detailLabel}>Mode:</div>
            <div className={styles.detailValue}>{formatNumber(action.mode)}</div>
          </div>

          <h4>Message Info:</h4>
          {renderMessageInfoDetails(action.outMsg.info, contractAddress)}

          <h4>Message Body:</h4>
          <div className={styles.detailRow}>
            <div className={styles.detailLabel}>BoC:</div>
            <div className={styles.detailValue}>
              <pre>{action.outMsg.body.toBoc().toString("hex")}</pre>
            </div>
          </div>
          <div className={styles.detailRow}>
            <div className={styles.detailLabel}>Cell:</div>
            <div className={styles.detailValue}>
              <pre>{action.outMsg.body.toString()}</pre>
            </div>
          </div>
          {renderStateInitDetails(action.outMsg.init)}
        </div>
      )
    }
    case "setCode": {
      return (
        <div className={styles.actionDetailsContent}>
          <h3>Set Code Details</h3>
          <div className={styles.detailRow}>
            <div className={styles.detailLabel}>New Code:</div>
            <div className={styles.detailValue}>{action.newCode.toString()}</div>
          </div>
        </div>
      )
    }
    case "reserve": {
      return (
        <div className={styles.actionDetailsContent}>
          <h3>Reserve Currency Details</h3>
          <div className={styles.detailRow}>
            <div className={styles.detailLabel}>Mode:</div>
            <div className={styles.detailValue}>{formatNumber(action.mode)}</div>
          </div>
          <div className={styles.detailRow}>
            <div className={styles.detailLabel}>TON Coins:</div>
            <div className={styles.detailValue}>{formatCurrency(action.currency.coins)}</div>
          </div>
          {action.currency.other && Object.keys(action.currency.other).length > 0 && (
            <div className={styles.detailRow}>
              <div className={styles.detailLabel}>Other Currencies:</div>
              <div className={styles.detailValue}>
                <pre>{JSON.stringify(action.currency.other, null, 2)}</pre>
              </div>
            </div>
          )}
        </div>
      )
    }
    case "changeLibrary": {
      return (
        <div className={styles.actionDetailsContent}>
          <h3>Change Library Details</h3>
          <div className={styles.detailRow}>
            <div className={styles.detailLabel}>Mode:</div>
            <div className={styles.detailValue}>{formatNumber(action.mode)}</div>
          </div>
          {action.libRef.type === "hash" && (
            <div className={styles.detailRow}>
              <div className={styles.detailLabel}>Library Hash:</div>
              <div className={styles.detailValue}>{action.libRef.libHash.toString("hex")}</div>
            </div>
          )}
          {action.libRef.type === "ref" && (
            <div className={styles.detailRow}>
              <div className={styles.detailLabel}>Library Cell Hash:</div>
              <div className={styles.detailValue}>
                {action.libRef.library.hash().toString("hex")}
              </div>
            </div>
          )}
        </div>
      )
    }
    default:
      return <pre>Unknown action type</pre>
  }
}

interface ActionModalProps {
  readonly action: OutAction | null
  readonly index: number
  readonly contractAddress: Address
  readonly onClose: () => void
}

function computeTitleAndIcon(action: OutAction) {
  switch (action.type) {
    case "sendMsg": {
      return {
        actionTitle: "Send Message",
        headerStyle: styles.actionHeaderSendMsg,
        iconContainerClass: styles.actionModalHeaderIconContainerSendMsg,
        headerIconSvg: (
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path
              d="M22 2L11 13M22 2L15 22L11 13L2 9L22 2Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ),
      }
    }
    case "setCode": {
      return {
        actionTitle: "Set Code",
        headerStyle: styles.actionHeaderSetCode,
        iconContainerClass: styles.actionModalHeaderIconContainerSetCode,
        headerIconSvg: (
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path
              d="M16 18L22 12L16 6M8 6L2 12L8 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ),
      }
    }
    case "reserve": {
      return {
        actionTitle: "Reserve Currency",
        headerStyle: styles.actionHeaderReserve,
        iconContainerClass: styles.actionModalHeaderIconContainerReserve,
        headerIconSvg: (
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path
              d="M12 1V23M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ),
      }
    }
    case "changeLibrary": {
      return {
        actionTitle: "Change Library",
        headerStyle: styles.actionModalHeader,
        iconContainerClass: styles.actionModalHeaderIconContainerChangeLibrary,
        headerIconSvg: (
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path
              d="M4 19V5C4 3.89543 4.89543 3 6 3H18C19.1046 3 20 3.89543 20 5V19L12 14L4 19Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M8 7H16"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ),
      }
    }
  }
}

const ActionModal: React.FC<ActionModalProps> = ({action, index, contractAddress, onClose}) => {
  if (!action) return null

  const {actionTitle, headerStyle, iconContainerClass, headerIconSvg} = computeTitleAndIcon(action)

  return (
    <Modal open={!!action} onClose={onClose} contentClassName={styles.actionModalFullScreenContent}>
      <div className={`${styles.actionModalHeader} ${headerStyle}`}>
        <div className={styles.modalTitleContent}>
          <h3 className={styles.modalTitleMain}>
            <span className={`${iconContainerClass} ${styles.actionModalHeaderIcon}`}>
              {headerIconSvg}
            </span>
            {actionTitle}
          </h3>
          <span className={styles.modalTitleSub}>Action #{index + 1}</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className={styles.actionModalClose}
          aria-label="Close modal"
        >
          <Icon
            svg={
              <svg width="18" height="18" viewBox="0 0 24 24">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            }
          />
        </button>
      </div>
      <div className={styles.actionModalBody}>
        <div className={styles.actionItemCard}>{renderActionDetails(action, contractAddress)}</div>
      </div>
    </Modal>
  )
}

export default ActionModal
