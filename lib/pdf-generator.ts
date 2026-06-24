import type { Database } from "@/types/supabase"

type Aluno = Database["public"]["Tables"]["alunos"]["Row"] & { matricula?: string | null }

type NotasDisciplina = {
  nome: string
  codigo: string
  notas: {
    1?: number
    2?: number
    3?: number
    4?: number
  }
  media: string
}

const formatDateSafe = (dateString: string | null | undefined): string | null => {
  if (!dateString) return null

  // Split the date string to avoid timezone conversion issues
  const [year, month, day] = dateString.split("-")
  if (!year || !month || !day) return null

  // Create date with local timezone to prevent day shift
  return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`
}

export async function generateAlunoPDF(aluno: Aluno, notas?: NotasDisciplina[]): Promise<void> {
  // Importação dinâmica do jsPDF
  const { jsPDF } = await import("jspdf")

  const doc = new jsPDF()

  // Configurações
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20
  let yPosition = 20

  // Função auxiliar para adicionar texto
  const addText = (text: string, fontSize = 10, isBold = false) => {
    doc.setFontSize(fontSize)
    if (isBold) {
      doc.setFont("helvetica", "bold")
    } else {
      doc.setFont("helvetica", "normal")
    }
    doc.text(text, margin, yPosition)
    yPosition += fontSize * 0.5
  }

  // Função auxiliar para adicionar campo
  const addField = (label: string, value: string | null | undefined) => {
    doc.setFontSize(9)
    doc.setFont("helvetica", "bold")
    doc.text(label + ":", margin, yPosition)
    doc.setFont("helvetica", "normal")
    doc.text(value || "-", margin + 50, yPosition)
    yPosition += 6
  }

  // Cabeçalho
  doc.setFillColor(59, 130, 246)
  doc.rect(0, 0, pageWidth, 30, "F")
  doc.setTextColor(255, 255, 255)
  addText("FICHA DE CADASTRO DO ALUNO", 16, true)
  yPosition += 10

  // Resetar cor do texto
  doc.setTextColor(0, 0, 0)

  // Dados Pessoais
  yPosition += 5
  addText("DADOS PESSOAIS", 12, true)
  yPosition += 3
  doc.setDrawColor(200, 200, 200)
  doc.line(margin, yPosition, pageWidth - margin, yPosition)
  yPosition += 8

  if (aluno.matricula) {
    doc.setFontSize(10)
    doc.setFont("helvetica", "bold")
    doc.text("Matrícula:", margin, yPosition)
    doc.setFontSize(12)
    doc.setTextColor(37, 99, 235) // Cor azul
    doc.text(aluno.matricula, margin + 50, yPosition)
    doc.setTextColor(0, 0, 0) // Resetar cor
    yPosition += 8
  }

  addField("Nome Completo", aluno.nome_completo)
  addField("CPF", aluno.cpf)
  addField("RG", aluno.rg)
  addField("Data de Nascimento", formatDateSafe(aluno.data_nascimento))
  addField("Sexo", aluno.sexo)
  addField("Naturalidade", aluno.naturalidade)

  // Certidão de Nascimento
  yPosition += 5
  addText("CERTIDÃO DE NASCIMENTO", 12, true)
  yPosition += 3
  doc.line(margin, yPosition, pageWidth - margin, yPosition)
  yPosition += 8

  addField("Número", aluno.certidao_nascimento_numero)
  addField("Livro", aluno.certidao_livro)
  addField("Folha", aluno.certidao_folha)
  addField("Cartório", aluno.certidao_cartorio)
  addField("UF", aluno.certidao_uf)
  addField("Data de Emissão", formatDateSafe(aluno.certidao_data_emissao))

  // Endereço
  yPosition += 5
  addText("ENDEREÇO", 12, true)
  yPosition += 3
  doc.line(margin, yPosition, pageWidth - margin, yPosition)
  yPosition += 8

  addField("Endereço", aluno.endereco)
  addField("Número", aluno.endereco_numero)
  addField("Bairro", aluno.bairro)
  addField("Cidade", aluno.cidade)
  addField("UF", aluno.uf)
  addField("CEP", aluno.cep)

  // Contato
  yPosition += 5
  addText("CONTATO", 12, true)
  yPosition += 3
  doc.line(margin, yPosition, pageWidth - margin, yPosition)
  yPosition += 8

  addField("Telefone", aluno.telefone)
  addField("Telefone Residencial", aluno.telefone_residencial)
  addField("Telefone Comercial", aluno.telefone_comercial)
  addField("Email", aluno.email)

  // Nova página
  doc.addPage()
  yPosition = 20

  // Dados dos Pais
  addText("DADOS DOS PAIS", 12, true)
  yPosition += 3
  doc.line(margin, yPosition, pageWidth - margin, yPosition)
  yPosition += 8

  addField("Nome da Mãe", aluno.nome_mae)
  addField("Celular da Mãe", aluno.celular_mae)
  addField("Profissão da Mãe", aluno.profissao_mae)
  yPosition += 3
  addField("Nome do Pai", aluno.nome_pai)
  addField("Celular do Pai", aluno.celular_pai)
  addField("Profissão do Pai", aluno.profissao_pai)

  // Responsável
  yPosition += 5
  addText("RESPONSÁVEL PELA MATRÍCULA", 12, true)
  yPosition += 3
  doc.line(margin, yPosition, pageWidth - margin, yPosition)
  yPosition += 8

  addField("Nome do Responsável", aluno.nome_responsavel)
  addField("Telefone", aluno.telefone_responsavel)
  addField("Email", aluno.email_responsavel)

  // Responsável Financeiro
  yPosition += 5
  addText("RESPONSÁVEL FINANCEIRO", 12, true)
  yPosition += 3
  doc.line(margin, yPosition, pageWidth - margin, yPosition)
  yPosition += 8

  addField("Nome", aluno.resp_fin_nome)
  addField("CPF", aluno.resp_fin_cpf)
  addField("RG", aluno.resp_fin_identidade)
  addField("Órgão Emissor", aluno.resp_fin_orgao_emissor)
  addField("UF", aluno.resp_fin_uf)
  addField("Estado Civil", aluno.resp_fin_estado_civil)
  addField("Grau de Parentesco", aluno.resp_fin_grau_parentesco)
  addField("Data de Nascimento", formatDateSafe(aluno.resp_fin_data_nascimento))
  addField("Telefone", aluno.resp_fin_telefone)

  // Endereço do Responsável Financeiro
  yPosition += 5
  addText("ENDEREÇO DO RESPONSÁVEL FINANCEIRO", 12, true)
  yPosition += 3
  doc.line(margin, yPosition, pageWidth - margin, yPosition)
  yPosition += 8

  addField("Endereço", aluno.resp_fin_endereco)
  addField("Bairro", aluno.resp_fin_bairro)
  addField("Cidade", aluno.resp_fin_cidade)
  addField("UF", aluno.resp_fin_uf_endereco)
  addField("CEP", aluno.resp_fin_cep)

  // Nova página
  doc.addPage()
  yPosition = 20

  // Informações de Saúde
  addText("INFORMAÇÕES DE SAÚDE", 12, true)
  yPosition += 3
  doc.line(margin, yPosition, pageWidth - margin, yPosition)
  yPosition += 8

  addField("Uso de Medicamento Contínuo", aluno.uso_medicamento_continuo ? "Sim" : "Não")
  if (aluno.uso_medicamento_continuo) {
    addField("Qual medicamento", aluno.medicamento_continuo_qual)
  }
  yPosition += 2
  addField("Alergia a Medicamento", aluno.alergia_medicamento ? "Sim" : "Não")
  if (aluno.alergia_medicamento) {
    addField("Qual medicamento", aluno.alergia_medicamento_qual)
  }
  yPosition += 2
  addField("Alergia a Alimento", aluno.alergia_alimento ? "Sim" : "Não")
  if (aluno.alergia_alimento) {
    addField("Qual alimento", aluno.alergia_alimento_qual)
  }

  // Informações Acadêmicas
  yPosition += 8
  addText("INFORMAÇÕES ACADÊMICAS", 12, true)
  yPosition += 3
  doc.line(margin, yPosition, pageWidth - margin, yPosition)
  yPosition += 8

  addField("Nível", aluno.nivel)
  addField("Período Letivo", aluno.periodo_letivo)
  addField("Turno Preferencial", aluno.turno_preferencial)

  // Observações
  if (aluno.observacoes) {
    yPosition += 8
    addText("OBSERVAÇÕES", 12, true)
    yPosition += 3
    doc.line(margin, yPosition, pageWidth - margin, yPosition)
    yPosition += 8

    doc.setFontSize(9)
    const splitText = doc.splitTextToSize(aluno.observacoes, pageWidth - 2 * margin)
    doc.text(splitText, margin, yPosition)
    yPosition += splitText.length * 5
  }

  // Notas (se fornecidas)
  if (notas && notas.length > 0) {
    yPosition += 10
    if (yPosition > 200) {
      doc.addPage()
      yPosition = 20
    }

    addText("NOTAS E DESEMPENHO", 12, true)
    yPosition += 3
    doc.line(margin, yPosition, pageWidth - margin, yPosition)
    yPosition += 8

    // Cabecalho da tabela de notas
    doc.setFontSize(8)
    doc.setFont("helvetica", "bold")
    doc.text("Disciplina", margin, yPosition)
    doc.text("1o Bim", margin + 60, yPosition)
    doc.text("2o Bim", margin + 80, yPosition)
    doc.text("3o Bim", margin + 100, yPosition)
    doc.text("4o Bim", margin + 120, yPosition)
    doc.text("Media", margin + 140, yPosition)
    yPosition += 5

    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)

    notas.forEach((disciplina) => {
      if (yPosition > 270) {
        doc.addPage()
        yPosition = 20
      }

      const nomeAbreviado = disciplina.nome.length > 25
        ? disciplina.nome.substring(0, 25) + "..."
        : disciplina.nome

      doc.text(nomeAbreviado, margin, yPosition)
      doc.text(disciplina.notas[1]?.toFixed(1) || "-", margin + 60, yPosition)
      doc.text(disciplina.notas[2]?.toFixed(1) || "-", margin + 80, yPosition)
      doc.text(disciplina.notas[3]?.toFixed(1) || "-", margin + 100, yPosition)
      doc.text(disciplina.notas[4]?.toFixed(1) || "-", margin + 120, yPosition)
      doc.setFont("helvetica", "bold")
      doc.text(disciplina.media, margin + 140, yPosition)
      doc.setFont("helvetica", "normal")
      yPosition += 5
    })
  }

  // Campo de Assinatura
  yPosition += 20
  if (yPosition > 250) {
    doc.addPage()
    yPosition = 40
  }

  doc.setDrawColor(0, 0, 0)
  doc.line(margin, yPosition, pageWidth / 2 - 10, yPosition)
  yPosition += 6
  doc.setFontSize(9)
  doc.text("Assinatura do Responsavel", margin, yPosition)

  doc.line(pageWidth / 2 + 10, yPosition - 6, pageWidth - margin, yPosition - 6)
  doc.text("Data: ___/___/______", pageWidth / 2 + 10, yPosition)

  // Salvar o PDF
  doc.save(`Ficha_${aluno.nome_completo?.replace(/\s+/g, "_") || "aluno"}.pdf`)
}
