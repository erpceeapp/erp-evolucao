import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"

/**
 * Formata CPF para o padrão XXX.XXX.XXX-XX
 */
export function formatCPF(cpf: string): string {
  if (!cpf) return ""
  const cleaned = cpf.replace(/\D/g, "")
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
}

/**
 * Remove formatação do CPF
 */
export function cleanCPF(cpf: string): string {
  return cpf.replace(/\D/g, "")
}

/**
 * Formata data ISO para formato brasileiro (DD/MM/YYYY)
 */
export function formatDateBR(date: string | Date): string {
  if (!date) return ""
  try {
    const dateObj = typeof date === "string" ? parseISO(date) : date
    return format(dateObj, "dd/MM/yyyy", { locale: ptBR })
  } catch {
    return ""
  }
}

/**
 * Formata data ISO para formato com dia da semana (Segunda, 15 de janeiro de 2024)
 */
export function formatDateWithDayName(date: string | Date): string {
  if (!date) return ""
  try {
    const dateObj = typeof date === "string" ? parseISO(date) : date
    return format(dateObj, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })
  } catch {
    return ""
  }
}

/**
 * Formata data para formato curto (15 de jan)
 */
export function formatDateShort(date: string | Date): string {
  if (!date) return ""
  try {
    const dateObj = typeof date === "string" ? parseISO(date) : date
    return format(dateObj, "dd 'de' MMM", { locale: ptBR })
  } catch {
    return ""
  }
}

/**
 * Formata hora (HH:MM)
 */
export function formatTime(time: string): string {
  if (!time) return ""
  return time.substring(0, 5)
}

/**
 * Formata data e hora
 */
export function formatDateTime(date: string | Date): string {
  if (!date) return ""
  try {
    const dateObj = typeof date === "string" ? parseISO(date) : date
    return format(dateObj, "dd/MM/yyyy HH:mm", { locale: ptBR })
  } catch {
    return ""
  }
}

/**
 * Calcula idade a partir da data de nascimento
 */
export function calcularIdade(dataNascimento: string | Date): number {
  try {
    const birthDate = typeof dataNascimento === "string" ? parseISO(dataNascimento) : dataNascimento
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    
    return age
  } catch {
    return 0
  }
}

/**
 * Formata telefone para padrão (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
 */
export function formatTelefone(telefone: string): string {
  if (!telefone) return ""
  const cleaned = telefone.replace(/\D/g, "")
  
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")
  }
  
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3")
  }
  
  return telefone
}

/**
 * Remove formatação de telefone
 */
export function cleanTelefone(telefone: string): string {
  return telefone.replace(/\D/g, "")
}

/**
 * Formata CEP para padrão XXXXX-XXX
 */
export function formatCEP(cep: string): string {
  if (!cep) return ""
  const cleaned = cep.replace(/\D/g, "")
  return cleaned.replace(/(\d{5})(\d{3})/, "$1-$2")
}

/**
 * Remove formatação de CEP
 */
export function cleanCEP(cep: string): string {
  return cep.replace(/\D/g, "")
}

/**
 * Capitaliza primeira letra de cada palavra
 */
export function capitalizeWords(text: string): string {
  if (!text) return ""
  return text
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

/**
 * Trunca texto e adiciona reticências
 */
export function truncateText(text: string, length: number = 50): string {
  if (!text) return ""
  if (text.length <= length) return text
  return text.substring(0, length) + "..."
}

/**
 * Formata número como moeda brasileira
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

/**
 * Formata nota com uma casa decimal
 */
export function formatNota(nota: number): string {
  if (nota === null || nota === undefined) return "-"
  return nota.toFixed(1)
}

/**
 * Converte nota de 0-100 para 0-10
 */
export function converterNotaEscala(nota: number, escalaOrigem: number = 100, escalaDestino: number = 10): number {
  if (nota === null || nota === undefined) return 0
  return (nota * escalaDestino) / escalaOrigem
}

/**
 * Verifica se nota é válida (0-10)
 */
export function isNotaValida(nota: number): boolean {
  return nota >= 0 && nota <= 10 && !isNaN(nota)
}

/**
 * Formata status com badge visual
 */
export function getStatusBadge(status: string): { label: string; color: string } {
  const statusMap: Record<string, { label: string; color: string }> = {
    ativa: { label: "Ativa", color: "bg-green-100 text-green-800" },
    transferida: { label: "Transferida", color: "bg-purple-100 text-purple-800" },
    cancelada: { label: "Cancelada", color: "bg-orange-100 text-orange-800" },
    trancada: { label: "Trancada", color: "bg-yellow-100 text-yellow-800" },
    concluida: { label: "Concluída", color: "bg-blue-100 text-blue-800" },
  }
  return statusMap[status] || { label: status, color: "bg-gray-100 text-gray-800" }
}
