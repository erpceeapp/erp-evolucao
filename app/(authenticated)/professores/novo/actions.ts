"use server"

import { createAdminClient } from "@/lib/supabase/admin"

export async function createProfessorUser(professorData: {
  email: string
  cpf: string
  nome_completo: string
  telefone: string
}) {
  try {
    // Senha padrão é o CPF sem formatação
    const senhaTemporaria = professorData.cpf.replace(/[^0-9]/g, "")

    console.log("[v0] Server Action: Criando usuário professor")

    const supabaseAdmin = createAdminClient()

    // Criar usuário usando admin API (requer Service Role Key)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: professorData.email,
      password: senhaTemporaria,
      email_confirm: true,
      user_metadata: {
        nome_completo: professorData.nome_completo,
        telefone: professorData.telefone,
        tipo_usuario: "professor",
      },
    })

    if (authError) {
      console.error("[v0] Erro ao criar usuário:", authError)
      return { error: authError.message }
    }

    console.log("[v0] Usuário criado com sucesso:", authData.user?.id)

    return {
      success: true,
      userId: authData.user?.id,
      senhaTemporaria: `${senhaTemporaria.substring(0, 3)}***`,
    }
  } catch (error: any) {
    console.error("[v0] Erro na Server Action:", error)
    return { error: error.message || "Erro ao criar usuário" }
  }
}
