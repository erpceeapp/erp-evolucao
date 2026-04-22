import { updateSession } from "@/lib/supabase/middleware"
import { verifyResponsavelToken } from "@/lib/responsavel-auth"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Rotas de API do responsavel - nao exigem autenticacao Supabase
  if (pathname.startsWith("/api/auth/responsavel") || pathname.startsWith("/api/responsavel")) {
    return NextResponse.next()
  }

  // Rotas do portal do responsavel - autenticacao propria via JWT cookie
  if (pathname.startsWith("/responsavel")) {
    // Pagina de login do responsavel nao precisa de autenticacao
    if (pathname === "/responsavel/login") {
      return NextResponse.next()
    }

    const token = request.cookies.get("responsavel-session")?.value
    console.log("[v0] Middleware responsavel - pathname:", pathname)
    console.log("[v0] Middleware responsavel - token exists:", !!token)
    console.log("[v0] Middleware responsavel - cookies:", request.cookies.getAll().map(c => c.name))

    if (!token) {
      console.log("[v0] Middleware - No token, redirecting to login")
      const url = request.nextUrl.clone()
      url.pathname = "/responsavel/login"
      return NextResponse.redirect(url)
    }

    try {
      const session = await verifyResponsavelToken(token)
      console.log("[v0] Middleware - Session verified:", !!session)
      if (!session) {
        console.log("[v0] Middleware - Invalid session, redirecting")
        const url = request.nextUrl.clone()
        url.pathname = "/responsavel/login"
        const response = NextResponse.redirect(url)
        response.cookies.delete("responsavel-session")
        return response
      }
    } catch (err) {
      // Se a verificacao falhar, redirecionar para login
      console.log("[v0] Middleware - Token verification error:", err)
      const url = request.nextUrl.clone()
      url.pathname = "/responsavel/login"
      return NextResponse.redirect(url)
    }

    console.log("[v0] Middleware - Access granted")
    return NextResponse.next()
  }

  // Demais rotas - autenticacao Supabase
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
