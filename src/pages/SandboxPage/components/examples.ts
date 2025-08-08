import type {MessageTestData} from "@features/sandbox/lib/transport/message"

export interface SandboxExample {
  readonly key: string
  readonly label: string
  readonly file: string
}

export const SANDBOX_EXAMPLES: ReadonlyArray<SandboxExample> = [
  {
    key: "tolk-counter",
    label: "Tolk: Counter",
    file: "tolk-sandbox-Counter should reset counter-2025-08-07T20-11-27.json",
  },
  {
    key: "tact-proofs",
    label: "Tact: Proofs TEP89",
    file: "tact-sandbox-Proofs TEP89 proof should correctly work for discoverable jettons-2025-08-08T08-23-05.json",
  },
]

export function findExampleByKey(key: string): SandboxExample | undefined {
  const normalized = key.trim().toLowerCase()
  return SANDBOX_EXAMPLES.find(ex => ex.key === normalized)
}

export function buildExampleUrl(file: string): string {
  return `https://i582.github.io/TxTracer/assets/sandbox-examples/${encodeURIComponent(file)}`
}

export async function fetchExampleData(file: string): Promise<MessageTestData[]> {
  const url = buildExampleUrl(file)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch example: ${res.status}`)
  return (await res.json()) as MessageTestData[]
}

export async function loadExampleByKey(key: string): Promise<MessageTestData[] | undefined> {
  const ex = findExampleByKey(key)
  if (!ex) return undefined
  return fetchExampleData(ex.file)
}
