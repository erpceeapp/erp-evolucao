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
