function stringToHex(str: string): string {
  return Array.from(str)
    .map(char => char.charCodeAt(0).toString(16).padStart(2, "0"))
    .join("")
}

function hexToString(hex: string): string {
  let result = ""
  for (let i = 0; i < hex.length; i += 2) {
    const hexPair = hex.substring(i, i + 2)
    result += String.fromCharCode(parseInt(hexPair, 16))
  }
  return result
}

export function encodeCodeToUrl(code: string): string {
  try {
    const encoded = stringToHex(code)
    const url = new URL(window.location.href)
    url.searchParams.set("code", encoded)
    return url.toString()
  } catch (error) {
    console.error("Failed to encode code to URL:", error)
    return window.location.href
  }
}

export function decodeCodeFromUrl(): string | null {
  try {
    const url = new URL(window.location.href)
    const encoded = url.searchParams.get("code")

    if (!encoded) {
      return null
    }

    if (!/^[0-9a-fA-F]*$/.test(encoded)) {
      console.error("Invalid hex code in URL query parameter")
      return null
    }

    return hexToString(encoded)
  } catch (error) {
    console.error("Failed to decode code from URL query parameter:", error)
    return null
  }
}
