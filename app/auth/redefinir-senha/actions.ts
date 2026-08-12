"use server"

import { cookies } from "next/headers"

export async function getAuthCode() {
  const cookieStore = await cookies()
  const code = cookieStore.get("auth_code")?.value
  if (code) {
    cookieStore.delete("auth_code")
  }
  return code ?? null
}
