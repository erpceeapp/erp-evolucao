"use server"

import crypto from "crypto"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

export async function createProfessorUser(professorData: {
  email: string
  cpf: string
  nome_completo: string
  telefone: string
}) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: "Usuário não autenticado" }
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("tipo_usuario")
      .eq("id", user.id)
      .single()

    if (!profile || !["admin", "diretor"].includes(profile.tipo_usuario)) {
      return { error: "Apenas administradores e diretores podem criar professores" }
    }

    // Senha temporária aleatória
    const senhaTemporaria = crypto.randomUUID().replace(/-/g, "").substring(0, 12)

    const supabaseAdmin = createAdminClient()

    // Primeiro, verificar se o usuário já existe no Auth
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find(
      (user) => user.email?.toLowerCase() === professorData.email.toLowerCase()
    )

    if (existingUser) {
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
        return { error: updateError.message }
      }

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
      return { error: authError.message }
    }

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

export async function deleteProfessor(professorId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: "Usuário não autenticado" }
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("tipo_usuario")
      .eq("id", user.id)
      .single()

    if (!profile || !["admin", "diretor"].includes(profile.tipo_usuario)) {
      return { error: "Apenas administradores e diretores podem excluir professores" }
    }

    const supabaseAdmin = createAdminClient()

    // Get user_id before deleting the professor
    const { data: prof } = await supabaseAdmin
      .from("professores")
      .select("user_id")
      .eq("id", professorId)
      .single()

    const { error: deleteError } = await supabaseAdmin.from("professores").delete().eq("id", professorId)

    if (deleteError) {
      return { error: deleteError.message }
    }

    // Cascade delete the linked auth user and profile
    if (prof?.user_id) {
      await supabaseAdmin.rpc("admin_delete_user", { p_user_id: prof.user_id })
    }

    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Erro ao excluir professor" }
  }
}
