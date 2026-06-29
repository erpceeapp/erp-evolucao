import type { IdMapping } from "./types"

const STORAGE_KEY = "@edu-erp/migration-mapping"

export function createEmptyMapping(): IdMapping {
  return {
    profiles: {},
    auth_users: {},
    professores: {},
    turmas: {},
  }
}

export function saveMapping(mapping: IdMapping): void {
  if (typeof window !== "undefined") {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(mapping))
  }
}

export function loadMapping(): IdMapping | null {
  if (typeof window === "undefined") return null
  const raw = sessionStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as IdMapping
  } catch {
    return null
  }
}

export function clearMapping(): void {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(STORAGE_KEY)
  }
}

export function mapId(
  mapping: IdMapping,
  mapName: keyof IdMapping,
  oldId: string | null | undefined,
): string | null {
  if (!oldId) return null
  const map = mapping[mapName]
  return map[oldId] ?? null
}
