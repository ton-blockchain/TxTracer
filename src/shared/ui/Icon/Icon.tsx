import React from "react"

interface IconProps {
  svg: React.ReactNode
  size?: number
  className?: string
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
