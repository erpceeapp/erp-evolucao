import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  console.log("[v0] Creating Supabase client")
  console.log("[v0] Supabase URL exists:", !!supabaseUrl)
  console.log("[v0] Supabase Anon Key exists:", !!supabaseAnonKey)

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("[v0] Missing Supabase environment variables")
    throw new Error("Missing Supabase environment variables. Please check your .env file.")
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      // Desabilita auto-refresh de token no cliente para evitar erros de fetch
      autoRefreshToken: false,
      // Desabilita persistência de sessão no cliente
      persistSession: false,
      // Desabilita detecção automática de sessão
      detectSessionInUrl: false,
    },
    global: {
      // Adiciona headers para melhor compatibilidade
      headers: {
        "X-Client-Info": "erp-educacional",
      },
    },
  })
}

export { createClient as createBrowserClient }
