import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"

const COOKIE_NAME = "responsavel-session"
const MAX_AGE = 60 * 60 * 8 // 8 horas

function getSecret() {
  const secret = process.env.SUPABASE_JWT_SECRET
  if (!secret) throw new Error("SUPABASE_JWT_SECRET not set")
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
