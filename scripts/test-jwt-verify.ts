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
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!

  // Check Docker container PGRST_JWT_SECRET structure
  console.log("=== JWT Validation Tests ===")

  const tests: [string, string][] = [
    ["No apikey at all", ""],
    ["Invalid apikey (garbage)", "this-is-a-completely-invalid-key"],
    ["Empty apikey", ""],
  ]

  for (const [name, apikey] of tests) {
    const url = baseUrl + "/rest/v1/profiles?select=id,email&limit=1"
    console.log(`\n--- ${name} ---`)
    const headers: Record<string, string> = {}
    if (apikey) headers["apikey"] = apikey
    try {
      const r = await fetch(url, { headers })
      console.log(`Status: ${r.status} ${r.statusText}`)
      const text = await r.text()
      console.log(`Body: ${text.substring(0, 300)}`)
    } catch (e: any) {
      console.log(`Error: ${e.message}`)
    }
  }

  // Check the actual PGRST_JWT_SECRET
  console.log("\n\n=== Checking SUPABASE_JWT_SECRET format ===")
  const jwtSecret = process.env.SUPABASE_JWT_SECRET || "NOT FOUND from env"
  console.log("From .env:", jwtSecret.substring(0, 30) + "...")
  
  // Decode both secrets to compare
  const fromDotEnv = "64D4vPUNZ4H555CSpgzNoqtxkC6P57jnsFPPt8pvPFW5Y1o/xWR3y0zXsay0pDgQSS8c8SuoF8fUBqpwnlhZhg=="
  const fromDotEnvBytes = Uint8Array.from(atob(fromDotEnv), c => c.charCodeAt(0))
  
  const containerKey = "super-secret-jwt-token-with-at-least-32-characters-long"
  const containerKeyBytes = new TextEncoder().encode(containerKey)
  
  console.log("\nSep-2024 secret bytes length:", fromDotEnvBytes.length)
  console.log("Container key bytes length:", containerKeyBytes.length)
  console.log("Are they the same?", fromDotEnvBytes.length === containerKeyBytes.length && 
    fromDotEnvBytes.every((b, i) => b === containerKeyBytes[i]))
  
  // Container key as hex
  console.log("\nContainer key bytes hex:", Array.from(containerKeyBytes).map(b => b.toString(16).padStart(2, '0')).join(' '))
  console.log("Env secret bytes hex:", Array.from(fromDotEnvBytes).map(b => b.toString(16).padStart(2, '0')).join(' '))
}

test().catch(console.error)
