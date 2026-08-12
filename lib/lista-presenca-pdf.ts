export type ListaPresencaAluno = {
  nome_completo: string
  matricula: string | null
}

type ListaPresencaPDFInput = {
  disciplinaNome: string
  turmaNome: string
  turmaSerie: string
  professorNome: string | null
  dataAula: string
  horario: string
  alunos: ListaPresencaAluno[]
}

export async function generateListaPresencaPDF({
  disciplinaNome,
  turmaNome,
  turmaSerie,
  professorNome,
  dataAula,
  horario,
  alunos,
}: ListaPresencaPDFInput): Promise<void> {
  const { jsPDF } = await import("jspdf")

  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 15
  let y = 15

  // Cabecalho
  doc.setFillColor(37, 99, 235)
  doc.rect(0, 0, pageWidth, 35, "F")
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.setFont("helvetica", "bold")
  doc.text("LISTA DE PRESENCA", pageWidth / 2, 15, { align: "center" })
  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.text(disciplinaNome, pageWidth / 2, 24, { align: "center" })
  doc.text(`${turmaNome} (${turmaSerie})`, pageWidth / 2, 30, { align: "center" })

  y = 45

  // Informacoes da aula
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(10)
  doc.setFont("helvetica", "bold")
  doc.text("Professor:", margin, y)
  doc.setFont("helvetica", "normal")
  doc.text(professorNome || "-", margin + 28, y)

  doc.setFont("helvetica", "bold")
  doc.text("Data:", margin + 110, y)
  doc.setFont("helvetica", "normal")
  doc.text(dataAula, margin + 130, y)

  y += 8

  doc.setFont("helvetica", "bold")
  doc.text("Horario:", margin, y)
  doc.setFont("helvetica", "normal")
  doc.text(horario || "-", margin + 28, y)

  y += 14

  // Tabela
  const colWidths = {
    numero: 12,
    matricula: 35,
    aluno: 95,
    presente: 28,
    ausente: 28,
  }
  const tableWidth =
    colWidths.numero + colWidths.matricula + colWidths.aluno + colWidths.presente + colWidths.ausente
  const tableStartX = (pageWidth - tableWidth) / 2

  const drawTableHeader = (topY: number) => {
    doc.setFillColor(37, 99, 235)
    doc.rect(tableStartX, topY, tableWidth, 10, "F")
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(8)
    doc.setFont("helvetica", "bold")

    let hx = tableStartX
    doc.text("N", hx + colWidths.numero / 2, topY + 7, { align: "center" })
    hx += colWidths.numero
    doc.text("Matricula", hx + 3, topY + 7)
    hx += colWidths.matricula
    doc.text("Nome do Aluno", hx + 3, topY + 7)
    hx += colWidths.aluno
    doc.text("Presente", hx + colWidths.presente / 2, topY + 7, { align: "center" })
    hx += colWidths.presente
    doc.text("Ausente", hx + colWidths.ausente / 2, topY + 7, { align: "center" })
  }

  drawTableHeader(y)
  y += 10

  doc.setTextColor(0, 0, 0)
  doc.setFont("helvetica", "normal")

  const rowHeight = 12
  const pageBreakY = 280
  const checkboxSize = 5

  alunos.forEach((aluno, index) => {
    if (y + rowHeight > pageBreakY) {
      doc.addPage()
      y = 20
      drawTableHeader(y)
      y += 10
      doc.setTextColor(0, 0, 0)
      doc.setFont("helvetica", "normal")
    }

    if (index % 2 === 0) {
      doc.setFillColor(250, 250, 250)
      doc.rect(tableStartX, y, tableWidth, rowHeight, "F")
    }
    doc.setDrawColor(220, 220, 220)
    doc.rect(tableStartX, y, tableWidth, rowHeight, "S")

    let x = tableStartX
    doc.setFontSize(8)
    doc.text(String(index + 1), x + colWidths.numero / 2, y + 8, { align: "center" })
    x += colWidths.numero
    doc.text(aluno.matricula || "-", x + 3, y + 8)
    x += colWidths.matricula
    doc.text(aluno.nome_completo, x + 3, y + 8)
    x += colWidths.aluno

    // Checkbox vazio para marcacao manual (Presente)
    doc.setDrawColor(100, 100, 100)
    const checkboxY = y + (rowHeight - checkboxSize) / 2
    doc.rect(x + colWidths.presente / 2 - checkboxSize / 2, checkboxY, checkboxSize, checkboxSize, "S")
    x += colWidths.presente
    // Checkbox vazio para marcacao manual (Ausente)
    doc.rect(x + colWidths.ausente / 2 - checkboxSize / 2, checkboxY, checkboxSize, checkboxSize, "S")

    y += rowHeight
  })

  y += 24

  // Area de assinatura
  doc.setDrawColor(0, 0, 0)
  const assinaturaWidth = 70
  const assinaturaX = pageWidth - margin - assinaturaWidth
  doc.line(assinaturaX, y, assinaturaX + assinaturaWidth, y)
  doc.setFontSize(9)
  doc.text("Assinatura do Professor", assinaturaX + assinaturaWidth / 2, y + 6, { align: "center" })

  y += 24

  // Data de geracao
  const dataAtual = new Date().toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  const pageHeight = doc.internal.pageSize.getHeight()
  if (y + 10 > pageHeight - 20) {
    doc.addPage()
    y = 20
  }

  doc.setTextColor(0, 0, 0)
  doc.setFontSize(9)
  doc.text(`Gerado em: ${dataAtual}`, pageWidth / 2, y, { align: "center" })

  // Rodape
  doc.setFontSize(7)
  doc.setTextColor(150, 150, 150)
  doc.text(
    "Documento gerado eletronicamente pelo sistema de gestao escolar.",
    pageWidth / 2,
    doc.internal.pageSize.getHeight() - 10,
    { align: "center" }
  )

  const nomeArquivo = `Lista_de_Presenca_${disciplinaNome.replace(/\s+/g, "_")}_${turmaNome.replace(/\s+/g, "_")}.pdf`
  doc.save(nomeArquivo)
}
