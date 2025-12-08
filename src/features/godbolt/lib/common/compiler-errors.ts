export interface ParsedError {
  readonly filename: string
  readonly line: number
  readonly column: number
  readonly message: string
  readonly severity: "error" | "warning" | "info"
}
