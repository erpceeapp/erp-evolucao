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

    // Primeiro, verificar se o usuário já existe no Auth
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find(
      (user) => user.email?.toLowerCase() === professorData.email.toLowerCase()
    )

    if (existingUser) {
      console.log("[v0] Usuário já existe no Auth, verificando se pode ser reutilizado...")
      
      // Verificar se o usuário já tem um perfil de professor ativo
      const { data: existingProfile } = await supabaseAdmin
        .from("profiles")
        .select("id, tipo_usuario")
        .eq("id", existingUser.id)
        .single()

      if (existingProfile) {
        // Se já existe um perfil, retornar erro
        return { error: "Este email já está cadastrado no sistema com outro perfil" }
      }

      // Se o usuário existe no Auth mas não tem perfil, podemos reutilizá-lo
      // Atualizar a senha para o CPF e os metadados
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        existingUser.id,
        {
          password: senhaTemporaria,
          email_confirm: true,
          user_metadata: {
            nome_completo: professorData.nome_completo,
            telefone: professorData.telefone,
            tipo_usuario: "professor",
          },
        }
      )

      if (updateError) {
        console.error("[v0] Erro ao atualizar usuário existente:", updateError)
        return { error: updateError.message }
      }

      console.log("[v0] Usuário existente reutilizado com sucesso:", existingUser.id)

      return {
        success: true,
        userId: existingUser.id,
        senhaTemporaria: `${senhaTemporaria.substring(0, 3)}***`,
        reutilizado: true,
      }
    }

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
