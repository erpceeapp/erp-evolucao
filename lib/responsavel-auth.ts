import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"
import { createResponsavelClient } from "./supabase/responsavel-client"

const COOKIE_NAME = "responsavel-session"
const MAX_AGE = 60 * 60 * 8 // 8 horas

function getSecret() {
  const secret = process.env.RESPONSAVEL_JWT_SECRET
  if (!secret) throw new Error("RESPONSAVEL_JWT_SECRET not set. Use a different secret from SUPABASE_JWT_SECRET.")
  return new TextEncoder().encode(secret)
}

export interface ResponsavelSession {
  email_responsavel: string
  aluno_id: string
  aluno_nome: string
  aluno_cpf: string
  turma_nome?: string
}

export async function createResponsavelSession(data: ResponsavelSession): Promise<string> {
  const token = await new SignJWT({ ...data })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(getSecret())

  // Retorna apenas o token - o cookie deve ser definido na resposta da API
  return token
}

export async function getResponsavelSession(): Promise<ResponsavelSession | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value

  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, getSecret())

    // Verificar se a sessao foi revogada
    const revoked = await checkSessionRevoked(payload.iat, payload.aluno_id as string)
    if (revoked) return null

    return {
      email_responsavel: payload.email_responsavel as string,
      aluno_id: payload.aluno_id as string,
      aluno_nome: payload.aluno_nome as string,
      aluno_cpf: payload.aluno_cpf as string,
      turma_nome: payload.turma_nome as string | undefined,
    }
  } catch {
    return null
  }
}

export async function checkSessionRevoked(iat: number | undefined, alunoId: string): Promise<boolean> {
  if (!iat) return false // JWT sem iat = antigo, permitir por compatibilidade

  try {
    const supabase = createResponsavelClient()
    const { data: ultimaRevogacao } = await supabase
      .rpc("get_ultima_revogacao", { p_aluno_id: alunoId })
      .single()

    if (!ultimaRevogacao) return false // nunca foi revogado

    // iat esta em segundos (Unix timestamp), ultimaRevogacao e ISO string
    const revogacaoMs = new Date(ultimaRevogacao as string).getTime()
    const iatMs = iat * 1000

    return iatMs < revogacaoMs
  } catch {
    return false // se falhar, permitir acesso (fail open)
  }
}

export async function destroyResponsavelSession() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

// Versao para middleware (nao usa cookies() do next/headers)
export async function verifyResponsavelToken(token: string): Promise<ResponsavelSession | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return {
      email_responsavel: payload.email_responsavel as string,
      aluno_id: payload.aluno_id as string,
      aluno_nome: payload.aluno_nome as string,
      aluno_cpf: payload.aluno_cpf as string,
      turma_nome: payload.turma_nome as string | undefined,
    }
  } catch {
    return null
  }
}
