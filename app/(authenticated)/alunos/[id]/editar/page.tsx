import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Users } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { BreadcrumbNav } from "@/components/breadcrumb-nav"
import { AlunoForm } from "@/components/alunos/aluno-form"

export default async function EditarAlunoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Buscar dados do aluno
  const { data: aluno, error: alunoError } = await supabase
    .from("alunos")
    .select("id, nome_completo, data_nascimento, sexo, naturalidade, cpf, rg, certidao_nascimento_numero, certidao_livro, certidao_folha, certidao_data_emissao, certidao_cartorio, certidao_uf, endereco, endereco_numero, bairro, cidade, uf, cep, telefone_residencial, telefone_comercial, telefone, email, nome_mae, profissao_mae, celular_mae, nome_pai, profissao_pai, celular_pai, nome_responsavel, telefone_responsavel, email_responsavel, resp_fin_nome, resp_fin_data_nascimento, resp_fin_estado_civil, resp_fin_cpf, resp_fin_identidade, resp_fin_orgao_emissor, resp_fin_uf, resp_fin_grau_parentesco, resp_fin_endereco, resp_fin_bairro, resp_fin_telefone, resp_fin_cidade, resp_fin_uf_endereco, resp_fin_cep, uso_medicamento_continuo, medicamento_continuo_qual, alergia_medicamento, alergia_medicamento_qual, alergia_alimento, alergia_alimento_qual, periodo_letivo, nivel, turno_preferencial, responsavel_matricula, observacoes, ativo")
    .eq("id", id)
    .single()

  if (alunoError || !aluno) {
    notFound()
  }

  return (
    <>
      <PageHeader
        icon={Users}
        title="Editar Aluno"
        description={`Atualize os dados de ${aluno.nome_completo}`}
        backHref={`/alunos/${id}`}
      />
      <BreadcrumbNav
        items={[
          { label: "Inicio", href: "/dashboard" },
          { label: "Alunos", href: "/alunos" },
          { label: aluno.nome_completo, href: `/alunos/${id}` },
          { label: "Editar" },
        ]}
        className="mt-2"
      />

      <AlunoForm aluno={aluno} isEditing={true} />
    </>
  )
}
