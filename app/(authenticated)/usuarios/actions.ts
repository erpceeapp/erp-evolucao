"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"

export async function createInvite(email: string, tipo_usuario: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Usuário nao autenticado" }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("tipo_usuario")
    .eq("id", user.id)
    .single()

  if (!profile || profile.tipo_usuario !== "admin") {
    return { error: "Sem permissao para criar convites" }
  }

  const token = crypto.randomUUID()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  const { error } = await supabase.from("user_invites").insert([
    {
      email,
      tipo_usuario,
      invited_by: user.id,
      token,
      expires_at: expiresAt.toISOString(),
    },
  ])

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/usuarios")
  return { success: true, token }
}

export async function deleteInvite(inviteId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Usuário nao autenticado" }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("tipo_usuario")
    .eq("id", user.id)
    .single()

  if (!profile || profile.tipo_usuario !== "admin") {
    return { error: "Sem permissao para excluir convites" }
  }

  const { error } = await supabase.from("user_invites").delete().eq("id", inviteId)

  if (error) {
    return { error: error.message }
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

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Usuário nao autenticado" }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("tipo_usuario")
    .eq("id", user.id)
    .single()

  if (!profile || profile.tipo_usuario !== "admin") {
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

export async function deleteUser(userId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Usuário nao autenticado" }
  }

  if (user.id === userId) {
    return { error: "Você não pode excluir o próprio usuário" }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("tipo_usuario")
    .eq("id", user.id)
    .single()

  if (!profile || profile.tipo_usuario !== "admin") {
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
