import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

  console.log("[v0] Middleware - Supabase URL exists:", !!supabaseUrl)
  console.log("[v0] Middleware - Supabase Anon Key exists:", !!supabaseAnonKey)

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("[v0] Middleware - Missing Supabase environment variables")
    return supabaseResponse
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({
          request,
        })
        cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  console.log("[v0] Middleware - User authenticated:", !!user)
  console.log("[v0] Middleware - Current path:", request.nextUrl.pathname)

  if (user && !request.nextUrl.pathname.startsWith("/auth/primeiro-acesso")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("primeira_senha, tipo_usuario")
      .eq("id", user.id)
      .single()

    console.log("[v0] Middleware - Profile:", profile)

    // Redirecionar para primeiro acesso apenas se for professor e primeira_senha = true
    if (profile?.primeira_senha === true && profile?.tipo_usuario === "professor") {
      console.log("[v0] Middleware - Redirecting professor to primeiro-acesso")
      const url = request.nextUrl.clone()
      url.pathname = "/auth/primeiro-acesso"
      return NextResponse.redirect(url)
    }
  }

  if (
    request.nextUrl.pathname !== "/" &&
    !user &&
    !request.nextUrl.pathname.startsWith("/login") &&
    !request.nextUrl.pathname.startsWith("/auth")
  ) {
    console.log("[v0] Middleware - Redirecting to login")
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
