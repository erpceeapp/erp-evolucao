import { SignJWT } from "jose"
import fs from "fs"

// Load .env and .env.local manually
for (const file of [".env", ".env.local"]) {
  const content = fs.readFileSync(file, "utf-8")
  for (const line of content.split("\n")) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const eqIdx = trimmed.indexOf("=")
    if (eqIdx === -1) continue
    const key = trimmed.substring(0, eqIdx).trim()
    let val = trimmed.substring(eqIdx + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = val
  }
}

async function test() {
  const secretStr = process.env.SUPABASE_JWT_SECRET!
  const secret = new TextEncoder().encode(secretStr)

  const jwt = await new SignJWT({ role: "service_role" })
    .setProtectedHeader({ alg: "HS256" })
    .setAudience("authenticated")
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(secret)

  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!

  const tables = ["profiles", "alunos", "professores", "turmas"]
  for (const table of tables) {
    const url = `${baseUrl}/rest/v1/${table}?select=id&limit=1`
    console.log(`\n--- ${table} ---`)
    try {
      const r = await fetch(url, { headers: { apikey: jwt } })
      console.log(`Status: ${r.status} ${r.statusText}`)
      const text = await r.text()
      console.log(`Body: ${text.substring(0, 300)}`)
    } catch (e: any) {
      console.log(`Error: ${e.message}`)
    }
  }
}

test().catch(console.error)
