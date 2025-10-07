export function getRawQueryParam(name: string): string | null {
  const search = window.location.search
  if (!search || search.length <= 1) return null
  const query = search.slice(1)
  const pairs = query.split("&")
  for (const pair of pairs) {
    if (!pair) continue
    const eq = pair.indexOf("=")
    const key = eq >= 0 ? pair.slice(0, eq) : pair
    if (key !== name) continue
    const raw = eq >= 0 ? pair.slice(eq + 1) : ""
    try {
      return decodeURIComponent(raw)
    } catch {
      return raw
    }
  }
  return null
}
