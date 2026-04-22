import { unstable_cache } from "next/cache"
import { createClient } from "@/lib/supabase/server"

/**
 * Cache de disciplinas ativas - revalidated a cada 1 hora
 * Usado em múltiplos componentes para evitar queries repetidas
 */
export const getCachedDisciplinas = unstable_cache(
  async () => {
    const supabase = await createClient()
    return supabase
      .from("disciplinas")
      .select("id, nome, carga_horaria")
      .eq("ativo", true)
      .order("nome", { ascending: true })
  },
  ["disciplinas-ativas"],
  { revalidate: 3600, tags: ["disciplinas"] }
)

/**
 * Cache de turmas ativas - revalidated a cada 30 minutos
 * Usado em filtros e seleção de turmas
 */
export const getCachedTurmas = unstable_cache(
  async () => {
    const supabase = await createClient()
    return supabase
      .from("turmas")
      .select("id, nome, ano_letivo")
      .eq("ativo", true)
      .order("nome", { ascending: true })
  },
  ["turmas-ativas"],
  { revalidate: 1800, tags: ["turmas"] }
)

/**
 * Cache de periodos letivos - revalidated a cada 1 hora
 * Utilizado para validação de notas e presença
 */
export const getCachedPeriodosLetivos = unstable_cache(
  async () => {
    const supabase = await createClient()
    return supabase
      .from("periodos_letivos")
      .select("id, nome, bimestre, data_inicio, data_fim, ano_letivo")
      .order("bimestre", { ascending: true })
  },
  ["periodos-letivos"],
  { revalidate: 3600, tags: ["periodos"] }
)

/**
 * Cache de configurações de campos obrigatórios
 * Usado para validação de formulários
 */
export const getCachedCamposObrigatorios = unstable_cache(
  async () => {
    const supabase = await createClient()
    const { data } = await supabase
      .from("config_campos_obrigatorios")
      .select("campo, obrigatorio")
    
    // Converter para um objeto para fácil acesso
    return data?.reduce((acc, item) => {
      acc[item.campo] = item.obrigatorio
      return acc
    }, {} as Record<string, boolean>) || {}
  },
  ["campos-obrigatorios"],
  { revalidate: 7200, tags: ["config"] }
)

/**
 * Cache de links de documentos
 * Utilizado no dashboard para mostrar links importantes
 */
export const getCachedLinksDocumentos = unstable_cache(
  async () => {
    const supabase = await createClient()
    return supabase
      .from("links_documentos")
      .select("id, titulo, url, ordem")
      .order("ordem", { ascending: true })
  },
  ["links-documentos"],
  { revalidate: 3600, tags: ["links"] }
)

/**
 * Cache de informações da escola
 * Usado em relatórios e PDFs
 */
export const getCachedEscola = unstable_cache(
  async () => {
    const supabase = await createClient()
    return supabase
      .from("escola")
      .select("nome, cnpj, telefone, email, endereco, cidade, estado, cep")
      .limit(1)
      .single()
  },
  ["escola-info"],
  { revalidate: 86400, tags: ["escola"] } // 24 horas
)

/**
 * Função para revalidar caches específicos após alterações
 * Usar em server actions após criar/editar dados
 */
export function revalidateCaches(tags: string[]) {
  // Revalidate é importado onde necessário
  // import { revalidateTag } from 'next/cache'
  // tags.forEach(tag => revalidateTag(tag))
}
