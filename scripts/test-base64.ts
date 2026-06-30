import { SignJWT } from "jose"
import fs from "fs"

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
  console.log("JWT_SECRET raw:", secretStr)
  console.log("JWT_SECRET ends with ==", secretStr.endsWith("=="))

  // Try both approaches
  const secretUtf8 = new TextEncoder().encode(secretStr)
  
  // Base64 decode
  const secretBytes = Uint8Array.from(atob(secretStr), c => c.charCodeAt(0))
  console.log("UTF8 length:", secretUtf8.length, "Base64 decoded length:", secretBytes.length)

  // Sign with base64-decoded key
  const jwt = await new SignJWT({ role: "service_role" })
    .setProtectedHeader({ alg: "HS256" })
    .setAudience("authenticated")
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(secretBytes)

  console.log("JWT:", jwt.substring(0, 60) + "...")

  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const url = baseUrl + "/rest/v1/profiles?select=id,email&limit=1"

  // Test: apikey: jwt (base64-decoded key), no Authorization
  console.log("\n--- Test: base64-decoded JWT as apikey ---")
  const r = await fetch(url, { headers: { apikey: jwt } })
  console.log("Status:", r.status, r.statusText)
  const text = await r.text()
  console.log("Body:", text.substring(0, 500))
}

test().catch(console.error)
