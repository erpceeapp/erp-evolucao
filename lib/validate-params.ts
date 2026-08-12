export function sanitizeSearchParam(value: string | null | undefined, maxLength = 100): string {
  if (!value) return ""
  return value.trim().slice(0, maxLength).replace(/[<>"'\\;]/g, "")
}

export function validatePageParam(value: string | null | undefined, defaultVal = 1): number {
  const num = Number.parseInt(value || "")
  if (isNaN(num) || num < 1) return defaultVal
  return Math.min(num, 1000)
}

export function validateLimitParam(value: string | null | undefined, defaultVal = 10): number {
  const num = Number.parseInt(value || "")
  if (isNaN(num) || num < 1) return defaultVal
  return Math.min(num, 100)
}

export function validateRequestOrigin(request: Request): boolean {
  if (process.env.NODE_ENV !== "production") return true

  const origin = request.headers.get("origin")
  const referer = request.headers.get("referer")
  const source = origin || referer

  if (!source) return false

  try {
    const sourceUrl = new URL(source)
    return sourceUrl.host === request.headers.get("host")
  } catch {
    return false
  }
}
