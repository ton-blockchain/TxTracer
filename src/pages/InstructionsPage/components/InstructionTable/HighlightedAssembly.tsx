import React from "react"

import styles from "./HighlightedAssembly.module.css"

export const HighlightedAssembly: React.FC<{code: string}> = ({code}) => {
  const lines = code.split("\n")

  return (
    <pre className={styles.assemblyContainer}>
      <code>
        {lines.map((line, lineIndex) => {
          const tokens = tokenizeCode(line)
          return (
            <React.Fragment key={lineIndex}>
              {tokens.map((token, tokenIndex) => {
                switch (token.type) {
                  case "instruction":
                    return (
                      <span key={`${lineIndex}-${tokenIndex}`} className={styles.tokenInstruction}>
                        {token.value}
                      </span>
                    )
                  case "register":
                    return (
                      <span key={`${lineIndex}-${tokenIndex}`} className={styles.tokenRegister}>
                        {token.value}
                      </span>
                    )
                  case "control_register":
                    return (
                      <span
                        key={`${lineIndex}-${tokenIndex}`}
                        className={styles.tokenControlRegister}
                      >
                        {token.value}
                      </span>
                    )
                  case "number":
                    return (
                      <span key={`${lineIndex}-${tokenIndex}`} className={styles.tokenNumber}>
                        {token.value}
                      </span>
                    )
                  case "comment":
                    return (
                      <span key={`${lineIndex}-${tokenIndex}`} className={styles.tokenComment}>
                        {token.value}
                      </span>
                    )
                  case "whitespace":
                    return <span key={`${lineIndex}-${tokenIndex}`}>{token.value}</span>
                  default:
                    return <span key={`${lineIndex}-${tokenIndex}`}>{token.value}</span>
                }
              })}
              {lineIndex < lines.length - 1 && <br />}
            </React.Fragment>
          )
        })}
      </code>
    </pre>
  )
}

interface Token {
  readonly type:
    | "instruction"
    | "register"
    | "control_register"
    | "number"
    | "comment"
    | "whitespace"
    | "other"
  readonly value: string
}

const tokenizeCode = (code: string): Token[] => {
  const tokens: Token[] = []
  let i = 0

  while (i < code.length) {
    const char = code[i]

    if (/\s/.test(char)) {
      let whitespace = char
      i++
      while (i < code.length && /\s/.test(code[i])) {
        whitespace += code[i]
        i++
      }
      tokens.push({type: "whitespace", value: whitespace})
      continue
    }

    if (char === "/" && code[i + 1] === "/") {
      const start = i
      i += 2
      while (i < code.length && code[i] !== "\n") {
        i++
      }
      tokens.push({type: "comment", value: code.slice(start, i)})
      continue
    }

    // Stack registers (s followed by digits)
    if (char === "s" && /^\d/.test(code[i + 1] || "")) {
      let register = char
      i++
      while (i < code.length && /\d/.test(code[i])) {
        register += code[i]
        i++
      }
      tokens.push({type: "register", value: register})
      continue
    }

    // Control registers (c followed by digits)
    if (char === "c" && /^\d/.test(code[i + 1] || "")) {
      let register = char
      i++
      while (i < code.length && /\d/.test(code[i])) {
        register += code[i]
        i++
      }
      tokens.push({type: "control_register", value: register})
      continue
    }

    if (char === "0" && code[i + 1] === "x") {
      // Hex number
      let number = char + code[i + 1]
      i += 2
      while (i < code.length && /[0-9a-fA-F]/.test(code[i])) {
        number += code[i]
        i++
      }
      tokens.push({type: "number", value: number})
      continue
    } else if (/\d/.test(char)) {
      // Decimal number
      let number = char
      i++
      while (i < code.length && /\d/.test(code[i])) {
        number += code[i]
        i++
      }
      tokens.push({type: "number", value: number})
      continue
    }

    if (/[A-Z#]/.test(char)) {
      let instruction = char
      i++
      while (i < code.length && /[A-Z0-9_#]/.test(code[i])) {
        instruction += code[i]
        i++
      }
      tokens.push({type: "instruction", value: instruction})
      continue
    }

    tokens.push({type: "other", value: char})
    i++
  }

  return tokens
}
