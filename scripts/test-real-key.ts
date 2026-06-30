import { SignJWT } from "jose"

async function test() {
  // The ACTUAL JWT secret used by the Docker containers (default Supabase local)
  const actualJwtSecret = "super-secret-jwt-token-with-at-least-32-characters-long"
  const secret = new TextEncoder().encode(actualJwtSecret)

  const jwt = await new SignJWT({ role: "service_role" })
    .setProtectedHeader({ alg: "HS256" })
    .setAudience("authenticated")
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(secret)

  console.log("JWT:", jwt.substring(0, 60) + "...")
  console.log("Using JWT secret: 'super-secret-jwt-token-with-at-least-32-characters-long'")
  
  const baseUrl = "http://127.0.0.1:54341"

  // Test A: JWT in Authorization header (no apikey)
  console.log("\n--- Test A: JWT in Authorization, no apikey ---")
  let r = await fetch(baseUrl + "/rest/v1/profiles?select=id,email&limit=1", {
    headers: { Authorization: "Bearer " + jwt }
  })
  console.log("Status:", r.status, r.statusText)
  console.log("Body:", (await r.text()).substring(0, 300))

  // Test B: JWT in BOTH headers
  console.log("\n--- Test B: JWT in both apikey + Authorization ---")
  r = await fetch(baseUrl + "/rest/v1/profiles?select=id,email&limit=1", {
    headers: {
      apikey: jwt,
      Authorization: "Bearer " + jwt
    }
  })
  console.log("Status:", r.status, r.statusText)
  console.log("Body:", (await r.text()).substring(0, 300))

  // Test C: Try alunos table with apikey + auth
  console.log("\n--- Test C: Alunos table with JWT in both ---")
  r = await fetch(baseUrl + "/rest/v1/alunos?select=id,nome_completo&limit=1", {
    headers: {
      apikey: jwt,
      Authorization: "Bearer " + jwt
    }
  })
  console.log("Status:", r.status, r.statusText)
  console.log("Body:", (await r.text()).substring(0, 300))
}

test().catch(console.error)
