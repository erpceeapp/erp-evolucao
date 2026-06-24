import { destroyResponsavelSession } from "@/lib/responsavel-auth"
import { NextResponse } from "next/server"

export async function POST() {
  await destroyResponsavelSession()
  return NextResponse.json({ success: true })
}
