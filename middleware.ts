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

    if (!token) {
      const url = request.nextUrl.clone()
      url.pathname = "/responsavel/login"
      return NextResponse.redirect(url)
    }

    try {
      const session = await verifyResponsavelToken(token)
      if (!session) {
        const url = request.nextUrl.clone()
        url.pathname = "/responsavel/login"
        const response = NextResponse.redirect(url)
        response.cookies.delete("responsavel-session")
        return response
      }
    } catch {
      // Se a verificacao falhar, redirecionar para login
      const url = request.nextUrl.clone()
      url.pathname = "/responsavel/login"
      return NextResponse.redirect(url)
    }

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
