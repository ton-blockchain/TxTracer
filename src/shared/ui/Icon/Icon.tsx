import React from "react"

interface IconProps {
  readonly svg: React.ReactNode
  readonly size?: number
  readonly className?: string
}

const Icon: React.FC<IconProps> = ({svg, size = 16, className = ""}) => (
  <span
    className={className}
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: size,
      height: size,
    }}
  >
    {svg}
  </span>
)
export default Icon
