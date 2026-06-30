"use server"

import crypto from "crypto"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"
import { translateError } from "@/lib/error-messages"
import bcrypt from "bcryptjs"

const CAN_CREATE = ["admin", "diretor", "coordenacao", "secretaria"]
const CAN_EDIT = ["admin", "diretor", "coordenacao", "secretaria"]

async function getCurrentUserTipo(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from("profiles")
    .select("tipo_usuario")
    .eq("id", user.id)
    .single()
  return profile?.tipo_usuario ?? null
}

export async function createInvite(email: string, tipo_usuario: string) {
  const supabase = await createClient()

  const tipo = await getCurrentUserTipo(supabase)
  if (!tipo || !CAN_CREATE.includes(tipo)) {
    return { error: "Sem permissao para criar convites" }
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Usuário nao autenticado" }
  }

  const token = crypto.randomUUID()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  const admin = createAdminClient()
  const { error } = await admin.from("user_invites").insert([
    {
      email,
      tipo_usuario,
      invited_by: user.id,
      token,
      expires_at: expiresAt.toISOString(),
    },
  ])

  if (error) {
    return { error: translateError(error.message) }
  }

  revalidatePath("/usuarios")
  return { success: true, token }
}

export async function createUser(data: {
  nome_completo: string
  email: string
  telefone?: string
  tipo_usuario: string
}) {
  const supabase = await createClient()

  const tipo = await getCurrentUserTipo(supabase)
  if (!tipo || !CAN_CREATE.includes(tipo)) {
    return { error: "Sem permissao para criar usuarios" }
  }

  const senhaTemporaria = crypto.randomUUID().replace(/-/g, "").substring(0, 12)

  try {
    const admin = createAdminClient()

    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email: data.email,
      password: senhaTemporaria,
      email_confirm: true,
      user_metadata: {
        nome_completo: data.nome_completo,
        telefone: data.telefone || null,
        tipo_usuario: data.tipo_usuario,
      },
    })

    if (authError) {
      return { error: translateError(authError.message) }
    }

    const userId = authData.user?.id
    if (!userId) {
      return { error: "Erro ao criar usuario" }
    }

    if (data.tipo_usuario === "professor") {
      const { error: profError } = await admin.from("professores").insert({
        user_id: userId,
        nome_completo: data.nome_completo,
        email: data.email,
        telefone: data.telefone || null,
        ativo: true,
      })

      if (profError) {
        return { error: translateError(profError.message) }
      }
    }

    revalidatePath("/usuarios")
    return { success: true, userId }
  } catch (error: any) {
    return { error: translateError(error.message) || "Erro ao criar usuario" }
  }
}

export async function deleteInvite(inviteId: string) {
  const supabase = await createClient()

  const tipo = await getCurrentUserTipo(supabase)
  if (!tipo || !CAN_CREATE.includes(tipo)) {
    return { error: "Sem permissao para excluir convites" }
  }

  const { error } = await supabase.from("user_invites").delete().eq("id", inviteId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/usuarios")
  return { success: true }
}

export async function deleteUser(userId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Usuário nao autenticado" }
  }

  if (user.id === userId) {
    return { error: "Você não pode excluir o próprio usuário" }
  }

  const tipo = await getCurrentUserTipo(supabase)
  if (!tipo || !CAN_CREATE.includes(tipo)) {
    return { error: "Sem permissao" }
  }

  const { error: rpcError } = await supabase.rpc("admin_delete_user", {
    p_user_id: userId,
  })

  if (rpcError) {
    return { error: `Erro ao excluir usuário: ${rpcError.message}` }
  }

  revalidatePath("/usuarios")
  return { success: true }
}

export async function updateUser(
  userId: string,
  data: {
    email?: string
    password?: string
    nome_completo?: string
    tipo_usuario?: string
  },
) {
  const supabase = await createClient()

  const tipo = await getCurrentUserTipo(supabase)
  if (!tipo || !CAN_EDIT.includes(tipo)) {
    return { error: "Sem permissao" }
  }

  if (data.email) {
    const { error: rpcError } = await supabase.rpc("admin_update_user_email", {
      p_user_id: userId,
      p_new_email: data.email,
    })
    if (rpcError) {
      return { error: `Erro ao atualizar email: ${rpcError.message}` }
    }
  }

  if (data.password) {
    const encryptedPassword = bcrypt.hashSync(data.password, 10)
    const { error: rpcError } = await supabase.rpc("admin_update_user_password", {
      p_user_id: userId,
      p_encrypted_password: encryptedPassword,
    })
    if (rpcError) {
      return { error: `Erro ao atualizar senha: ${rpcError.message}` }
    }
  }

  if (data.nome_completo || data.tipo_usuario) {
    const { error: rpcError } = await supabase.rpc("admin_update_user_profile", {
      p_user_id: userId,
      p_nome_completo: data.nome_completo || null,
      p_tipo_usuario: data.tipo_usuario || null,
    })

    if (rpcError) {
      return { error: `Erro ao atualizar perfil: ${rpcError.message}` }
    }
  }

  revalidatePath("/usuarios")
  return { success: true }
}
