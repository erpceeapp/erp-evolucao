export type DeclaracaoMatriculaInput = {
  escola: {
    nome: string | null
    cnpj: string | null
    endereco: string | null
    telefone: string | null
    email: string | null
  }
  aluno: {
    nome_completo: string
    cpf: string | null
    data_nascimento: string | null
  }
  turma: {
    nome: string
    serie: string | null
    turno: string | null
  }
  numero_matricula: string
  ano_letivo: number
}

function formatDateSafe(dateString: string | null | undefined): string | null {
  if (!dateString) return null
  const [year, month, day] = dateString.split("-")
  if (!year || !month || !day) return null
  return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`
}

export async function generateDeclaracaoMatriculaPDF(input: DeclaracaoMatriculaInput): Promise<void> {
  const { jsPDF } = await import("jspdf")

  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20
  let y = 20

  // Cabecalho azul
  doc.setFillColor(37, 99, 235)
  doc.rect(0, 0, pageWidth, 35, "F")
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(14)
  doc.setFont("helvetica", "bold")
  doc.text("DECLARACAO DE MATRICULA", pageWidth / 2, 15, { align: "center" })
  doc.setFontSize(11)
  doc.setFont("helvetica", "normal")
  doc.text(input.escola.nome || "", pageWidth / 2, 26, { align: "center" })

  y = 50

  doc.setTextColor(0, 0, 0)
  doc.setFontSize(12)
  doc.setFont("helvetica", "normal")

  const textoDeclaracao =
    `Declaramos, para os devidos fins, que ${input.aluno.nome_completo}, ` +
    `inscrito(a) sob a matricula no ${input.numero_matricula}, encontra-se regularmente ` +
    `matriculado(a) nesta instituicao de ensino no ano letivo de ${input.ano_letivo}, ` +
    `na turma ${input.turma.nome}` +
    (input.turma.serie ? ` (${input.turma.serie})` : "") +
    (input.turma.turno ? `, turno ${input.turma.turno}` : "") +
    `.`

  const linhas = doc.splitTextToSize(textoDeclaracao, pageWidth - 2 * margin)
  doc.text(linhas, margin, y)
  y += linhas.length * 7 + 12

  // Dados do aluno
  doc.setFontSize(11)
  doc.setFont("helvetica", "bold")
  doc.text("DADOS DO ALUNO", margin, y)
  y += 4
  doc.setDrawColor(200, 200, 200)
  doc.line(margin, y, pageWidth - margin, y)
  y += 10

  const addField = (label: string, value: string | null | undefined) => {
    doc.setFontSize(10)
    doc.setFont("helvetica", "bold")
    doc.text(`${label}:`, margin, y)
    doc.setFont("helvetica", "normal")
    doc.text(value || "-", margin + 60, y)
    y += 7
  }

  addField("Nome Completo", input.aluno.nome_completo)
  addField("CPF", input.aluno.cpf)
  addField("Data de Nascimento", formatDateSafe(input.aluno.data_nascimento))
  addField("Turma", `${input.turma.nome}${input.turma.serie ? ` (${input.turma.serie})` : ""}`)
  addField("Turno", input.turma.turno)
  addField("Ano Letivo", String(input.ano_letivo))
  addField("Numero de Matricula", input.numero_matricula)

  // Dados da escola
  y += 8
  doc.setFontSize(11)
  doc.setFont("helvetica", "bold")
  doc.text("INSTITUICAO", margin, y)
  y += 4
  doc.line(margin, y, pageWidth - margin, y)
  y += 10

  addField("Nome", input.escola.nome)
  addField("CNPJ", input.escola.cnpj)
  addField("Endereco", input.escola.endereco)
  addField("Telefone", input.escola.telefone)
  addField("Email", input.escola.email)

  // Data de emissao
  y += 8
  const dataAtual = new Date().toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  const pageHeight = doc.internal.pageSize.getHeight()
  if (y + 10 > pageHeight - 60) {
    doc.addPage()
    y = 30
  }

  doc.setFontSize(9)
  doc.setTextColor(100, 100, 100)
  doc.text(`Documento emitido em ${dataAtual}.`, pageWidth / 2, y, { align: "center" })

  // Linha de assinatura
  y += 30
  if (y > pageHeight - 40) {
    doc.addPage()
    y = 60
  }

  doc.setDrawColor(0, 0, 0)
  doc.line(margin, y, pageWidth / 2 - 10, y)
  y += 6
  doc.setFontSize(9)
  doc.setTextColor(0, 0, 0)
  doc.text("Assinatura e carimbo da instituicao", margin, y)

  doc.line(pageWidth / 2 + 10, y - 6, pageWidth - margin, y - 6)
  doc.text("Data: ___/___/______", pageWidth / 2 + 10, y)

  // Rodape
  doc.setFontSize(7)
  doc.setTextColor(150, 150, 150)
  doc.text(
    "Documento gerado eletronicamente pelo sistema de gestao escolar.",
    pageWidth / 2,
    pageHeight - 10,
    { align: "center" }
  )

  const nomeArquivo = `Declaracao_Matricula_${input.numero_matricula}.pdf`
  doc.save(nomeArquivo)
}
