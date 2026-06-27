import { NextResponse, type NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_error`)
  }

  // Sempre redireciona pra página que faz o exchange no client-side
  return NextResponse.redirect(`${origin}/auth/redefinir-senha?code=${code}`)
}
