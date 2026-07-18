import { destroyResponsavelSession } from "@/lib/responsavel-auth"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { validateRequestOrigin } from "@/lib/validate-params"

export async function POST(request: Request) {
  if (!validateRequestOrigin(request)) {
    return NextResponse.json({ error: "Origem nao permitida" }, { status: 403 })
  }

  const cookieStore = await cookies()
  const token = cookieStore.get("responsavel-session")?.value

  if (!token) {
    return NextResponse.json({ error: "Nao ha sessao ativa" }, { status: 401 })
  }

  await destroyResponsavelSession()
  return NextResponse.json({ success: true })
}
