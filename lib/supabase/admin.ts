import { createClient } from "@supabase/supabase-js"
import fs from "fs"
import path from "path"

function isLocalSupabase(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  return url.includes("127.0.0.1") || url.includes("localhost")
}

function loadServiceRoleKeyFromFile(): string {
  const files = [
    path.join(process.cwd(), ".env.local"),
    path.join(process.cwd(), ".env"),
  ]
  for (const file of files) {
    try {
      const content = fs.readFileSync(file, "utf-8")
      for (const line of content.split("\n")) {
        const trimmed = line.trim()
        if (trimmed.startsWith("SUPABASE_SERVICE_ROLE_KEY=")) {
          const val = trimmed.slice("SUPABASE_SERVICE_ROLE_KEY=".length)
          return val.startsWith('"') && val.endsWith('"')
            ? val.slice(1, -1)
            : val.startsWith("'") && val.endsWith("'")
              ? val.slice(1, -1)
              : val
        }
      }
    } catch {
      // file not found, try next
    }
  }
  throw new Error("SUPABASE_SERVICE_ROLE_KEY not found in .env.local or .env")
}

function loadServiceRoleKey(): string {
  if (isLocalSupabase()) {
    try { return loadServiceRoleKeyFromFile() } catch { /* fallback below */ }
  }

  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (key) return key

  return loadServiceRoleKeyFromFile()
}

export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = loadServiceRoleKey()

  if (!supabaseUrl) {
    throw new Error("Missing Supabase environment variables for admin client")
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        apikey: supabaseServiceRoleKey,
        Authorization: `Bearer ${supabaseServiceRoleKey}`,
      },
    },
  })
}

export async function adminFetch<T>(
  path: string,
  options?: { method?: string; body?: unknown; params?: Record<string, string> }
): Promise<{ data: T | null; error: string | null }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = loadServiceRoleKey()

  if (!supabaseUrl) {
    return { data: null, error: "SUPABASE_URL is not set" }
  }

  const url = new URL(`${supabaseUrl}/rest/v1/${path}`)
  if (options?.params) {
    Object.entries(options.params).forEach(([k, v]) => url.searchParams.set(k, v))
  }

  try {
    const res = await fetch(url.toString(), {
      method: options?.method || "GET",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: options?.body ? JSON.stringify(options.body) : undefined,
    })

    if (!res.ok) {
      const text = await res.text()
      return { data: null, error: `HTTP ${res.status}: ${text}` }
    }

    const text = await res.text()
    if (!text) return { data: null, error: null }

    try {
      const data = JSON.parse(text) as T
      return { data, error: null }
    } catch {
      return { data: null, error: null }
    }
  } catch (err) {
    return { data: null, error: String(err) }
  }
}

export async function adminAuthFetch<T>(
  path: string,
  options?: { method?: string; body?: unknown }
): Promise<{ data: T | null; error: string | null }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = loadServiceRoleKey()

  if (!supabaseUrl) {
    return { data: null, error: "SUPABASE_URL is not set" }
  }

  const url = new URL(`${supabaseUrl}/auth/v1/${path}`)

  try {
    const res = await fetch(url.toString(), {
      method: options?.method || "GET",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: options?.body ? JSON.stringify(options.body) : undefined,
    })

    if (!res.ok) {
      const text = await res.text()
      return { data: null, error: `HTTP ${res.status}: ${text}` }
    }

    const text = await res.text()
    if (!text) return { data: null, error: null }

    try {
      const data = JSON.parse(text) as T
      return { data, error: null }
    } catch {
      return { data: null, error: null }
    }
  } catch (err) {
    return { data: null, error: String(err) }
  }
}
