import { updateSession } from "@/lib/supabase/middleware"
import { verifyResponsavelToken } from "@/lib/responsavel-auth"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Rotas de API do responsavel - nao exigem autenticacao Supabase
  if (pathname.startsWith("/api/auth/responsavel") || pathname.startsWith("/api/responsavel")) {
    const response = NextResponse.next()
    addSecurityHeaders(response)
    return response
  }

  // Rotas do portal do responsavel - autenticacao propria via JWT cookie
  if (pathname.startsWith("/responsavel")) {
    const token = request.cookies.get("responsavel-session")?.value

    if (!token) {
      const url = request.nextUrl.clone()
      url.pathname = "/auth/login"
      return NextResponse.redirect(url)
    }

    try {
      const session = await verifyResponsavelToken(token)
      if (!session) {
        const url = request.nextUrl.clone()
        url.pathname = "/auth/login"
        const response = NextResponse.redirect(url)
        response.cookies.delete("responsavel-session")
        return response
      }
    } catch {
      const url = request.nextUrl.clone()
      url.pathname = "/auth/login"
      return NextResponse.redirect(url)
    }

    const response = NextResponse.next()
    addSecurityHeaders(response)
    return response
  }

  // Demais rotas - autenticacao Supabase
  const response = await updateSession(request)
  addSecurityHeaders(response)
  return response
}

function addSecurityHeaders(response: NextResponse) {
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-XSS-Protection", "0")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' https://*.supabase.co data:",
      "connect-src 'self' https://*.supabase.co",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  )
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
