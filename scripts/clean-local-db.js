const fs = require("fs")

function loadEnvVar(filePath, name) {
  try {
    const content = fs.readFileSync(filePath, "utf-8")
    for (const line of content.split("\n")) {
      const trimmed = line.trim()
      if (trimmed.startsWith(`${name}=`)) {
        const val = trimmed.slice(name.length + 1)
        return val.replace(/^["']|["']$/g, "")
      }
    }
  } catch {}
  return null
}

const supabaseUrl = loadEnvVar(".env.local", "NEXT_PUBLIC_SUPABASE_URL") ||
  loadEnvVar(".env", "NEXT_PUBLIC_SUPABASE_URL")
const key = loadEnvVar(".env.local", "SUPABASE_SERVICE_ROLE_KEY") ||
  loadEnvVar(".env", "SUPABASE_SERVICE_ROLE_KEY")

if (!supabaseUrl || !key) {
  console.error("Erro: NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY sao obrigatorios em .env.local")
  process.exit(1)
}

const restUrl = `${supabaseUrl}/rest/v1`
const authUrl = `${supabaseUrl}/auth/v1`
const headers = { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Accept: "application/json" }
const delAll = async (table) => {
  const res = await fetch(`${restUrl}/${table}?id=neq.00000000-0000-0000-0000-000000000000`, { method: "DELETE", headers: { ...headers, Prefer: "count=exact" } })
  const count = res.headers.get("content-range")?.match(/\/(\d+)$/)?.[1] || "?"
  console.log(`  DELETE ${table} -> Status ${res.status} (${count})`)
  return res
}
const get = (url) => fetch(url, { method: "GET", headers }).then((r) => r.ok ? r.json() : null)

async function main() {
  console.log("=== Clean local DB (preserva admin) ===\n")
  console.log(`URL: ${supabaseUrl}\n`)

  // 1. Buscar admin ID antes de deletar
  const admins = await get(`${restUrl}/profiles?tipo_usuario=eq.admin&select=id,email`)
  if (!admins || admins.length === 0) {
    console.log("Nenhum admin encontrado. Abortando para preservar dados.\n")
    console.log("Dica: faca login como admin, depois rode este script novamente.")
    return
  }
  const adminIds = admins.map((a) => a.id)
  const adminEmails = admins.map((a) => a.email)
  console.log(`Admins preservados: ${adminEmails.join(", ")}\n`)

  // 2. Deletar tabelas de aplicacao (ordem FK-safe)
  const tables = ["matriculas", "turma_disciplinas", "alunos", "turmas", "disciplinas", "professores"]
  for (const table of tables) {
    await delAll(table)
  }

  // 3. Deletar profiles (exceto admin)
  const adminIdList = adminIds.join(",")
  console.log(`\n  DELETE profiles (exceto admin)...`)
  const profRes = await fetch(`${restUrl}/profiles?id=not.in.(${adminIdList})`, { method: "DELETE", headers })
  const profCount = profRes.status === 200 ? (await profRes.json()).length : "?"
  console.log(`  -> Status ${profRes.status} (${profCount} linhas)`)

  // 4. Deletar auth.users (exceto admin)
  console.log(`\n  DELETE auth.users (exceto admin)...`)
  const authRes = await fetch(`${authUrl}/admin/users`, { method: "GET", headers })
  if (authRes.ok) {
    const body = await authRes.json()
    const users = body.users || []
    const adminIdSet = new Set(adminIds)
    const toDelete = users.filter((u) => !adminIdSet.has(u.id))
    for (const u of toDelete) {
      const r = await fetch(`${authUrl}/admin/users/${u.id}`, { method: "DELETE", headers })
      console.log(`  -> ${u.email}: status ${r.status}`)
    }
    console.log(`  ${toDelete.length} usuarios deletados, ${users.length - toDelete.length} preservados`)
  } else {
    console.log("  Auth API indisponivel, auth.users nao foi limpo")
  }

  console.log("\n=== Done ===")
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
