import React from "react"

import styles from "./Badge.module.css"

interface BadgeProps {
  readonly color?: "green" | "red" | "blue" | "gray"
  readonly children: React.ReactNode
}

const Badge: React.FC<BadgeProps> = ({color = "gray", children}) => {
  const colorClass = {
    green: styles.badgeGreen,
    red: styles.badgeRed,
    blue: styles.badgeBlue,
    gray: styles.badgeGray,
  }[color]

  return <span className={`${styles.badge} ${colorClass}`}>{children}</span>
}

export default Badge
