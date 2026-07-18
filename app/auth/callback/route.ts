import { NextResponse, type NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_error`)
  }

  const response = NextResponse.redirect(`${origin}/auth/redefinir-senha`)

  response.cookies.set("auth_code", code, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/auth/redefinir-senha",
    maxAge: 60,
  })

  return response
}
