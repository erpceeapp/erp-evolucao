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
  const secretStr = process.env.SUPABASE_JWT_SECRET
  console.log("SUPABASE_JWT_SECRET loaded:", !!secretStr, "length:", secretStr?.length)

  const secret = new TextEncoder().encode(secretStr!)
  const jwt = await new SignJWT({ role: "service_role" })
    .setProtectedHeader({ alg: "HS256" })
    .setAudience("authenticated")
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(secret)

  console.log("JWT generated:", jwt.substring(0, 80) + "...")

  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  console.log("Base URL:", baseUrl)

  const url = baseUrl + "/rest/v1/profiles?select=id,email&limit=1"

  // Test 1: JWT as apikey + Bearer
  console.log("\n--- Test 1: JWT as apikey + Bearer ---")
  try {
    const r1 = await fetch(url, {
      headers: {
        apikey: jwt,
        Authorization: "Bearer " + jwt,
      },
    })
    console.log("Status:", r1.status, r1.statusText)
    const text1 = await r1.text()
    console.log("Body:", text1.substring(0, 300))
  } catch (e: any) {
    console.log("Error:", e.message)
  }

  // Test 2: Raw sb_secret key
  console.log("\n--- Test 2: Raw sb_secret key ---")
  try {
    const r2 = await fetch(url, {
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
        Authorization: "Bearer " + process.env.SUPABASE_SERVICE_ROLE_KEY!,
      },
    })
    console.log("Status:", r2.status, r2.statusText)
    const text2 = await r2.text()
    console.log("Body:", text2.substring(0, 300))
  } catch (e: any) {
    console.log("Error:", e.message)
  }

  // Test 3: Anon key
  console.log("\n--- Test 3: Anon key ---")
  try {
    const r3 = await fetch(url, {
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        Authorization: "Bearer " + process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      },
    })
    console.log("Status:", r3.status, r3.statusText)
    const text3 = await r3.text()
    console.log("Body:", text3.substring(0, 300))
  } catch (e: any) {
    console.log("Error:", e.message)
  }

  // Test 4: JWT only in apikey, no Authorization
  console.log("\n--- Test 4: JWT only in apikey (no Authorization) ---")
  try {
    const r4 = await fetch(url, {
      headers: {
        apikey: jwt,
      },
    })
    console.log("Status:", r4.status, r4.statusText)
    const text4 = await r4.text()
    console.log("Body:", text4.substring(0, 300))
  } catch (e: any) {
    console.log("Error:", e.message)
  }

  // Test 5: JWT only in Authorization, no apikey
  console.log("\n--- Test 5: JWT only in Authorization (no apikey) ---")
  try {
    const r5 = await fetch(url, {
      headers: {
        Authorization: "Bearer " + jwt,
      },
    })
    console.log("Status:", r5.status, r5.statusText)
    const text5 = await r5.text()
    console.log("Body:", text5.substring(0, 300))
  } catch (e: any) {
    console.log("Error:", e.message)
  }
}

test().catch(console.error)
