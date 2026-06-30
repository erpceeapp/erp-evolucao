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

  // Test A: role: service_role, aud: authenticated (current)
  const jwtA = await new SignJWT({ role: "service_role" })
    .setProtectedHeader({ alg: "HS256" })
    .setAudience("authenticated")
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(secret)

  // Test B: role: service_role, no aud
  const jwtB = await new SignJWT({ role: "service_role" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(secret)

  // Test C: aud: service_role, no explicit role
  const jwtC = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setAudience("service_role")
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(secret)

  // Test D: role: service_role explicitly, different audience
  const jwtD = await new SignJWT({ role: "service_role" })
    .setProtectedHeader({ alg: "HS256" })
    .setAudience("service_role")
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(secret)

  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const url = baseUrl + "/rest/v1/profiles?select=id,email&limit=1"

  for (const [name, jwt] of [["A: role=service_role, aud=authenticated", jwtA], ["B: role=service_role, no aud", jwtB], ["C: aud=service_role", jwtC], ["D: role=service_role, aud=service_role", jwtD]]) {
    console.log(`\n--- ${name} ---`)
    console.log(`JWT: ${jwt.substring(0, 60)}...`)
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
