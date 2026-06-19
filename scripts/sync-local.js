const { execSync } = require("child_process")

const commands = [
    { cmd: "supabase db pull", ignoreError: true },
    { cmd: "supabase db dump --data-only -f supabase/seed.sql", ignoreError: false },
    { cmd: "supabase db reset", ignoreError: false },
]

for (const { cmd, ignoreError } of commands) {
    try {
        console.log(`\n> ${cmd}`)
        execSync(cmd, { stdio: "inherit", cwd: process.cwd() })
    } catch (e) {
        if (ignoreError) {
            console.log(`  ↳ Aviso: comando ignorou erro (schema já sincronizado)`)
        } else {
            console.error(`  ↳ Erro ao executar: ${cmd}`)
            process.exit(1)
        }
    }
}

console.log("\n✅ Sincronização concluída!")
