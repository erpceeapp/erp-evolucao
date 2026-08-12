export type NotaAlunoLinha = {
  nome_completo: string
  matricula: string | null
  notas: (string | null)[]
  media: string
}

type NotasPDFInput = {
  disciplinaNome: string
  turmaNome: string
  turmaSerie: string
  anoLetivo: number
  professorNome: string | null
  alunos: NotaAlunoLinha[]
}

export async function generateNotasPDF({
  disciplinaNome,
  turmaNome,
  turmaSerie,
  anoLetivo,
  professorNome,
  alunos,
}: NotasPDFInput): Promise<void> {
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
  doc.text("REGISTRO DE NOTAS", pageWidth / 2, 15, { align: "center" })
  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.text(disciplinaNome, pageWidth / 2, 24, { align: "center" })
  doc.text(`${turmaNome} (${turmaSerie})`, pageWidth / 2, 30, { align: "center" })

  y = 45

  // Dados do professor e da turma
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(10)
  doc.setFont("helvetica", "bold")
  doc.text("Professor:", margin, y)
  doc.setFont("helvetica", "normal")
  doc.text(professorNome || "-", margin + 28, y)

  doc.setFont("helvetica", "bold")
  doc.text("Turma:", margin + 90, y)
  doc.setFont("helvetica", "normal")
  doc.text(turmaNome, margin + 110, y)

  doc.setFont("helvetica", "bold")
  doc.text("Ano Letivo:", margin + 150, y)
  doc.setFont("helvetica", "normal")
  doc.text(String(anoLetivo), margin + 178, y)

  y += 12

  // Tabela
  const colWidths = {
    aluno: 80,
    matricula: 30,
    bimestre: 18,
    media: 22,
  }
  const tableWidth =
    colWidths.aluno + colWidths.matricula + colWidths.bimestre * 4 + colWidths.media
  const tableStartX = (pageWidth - tableWidth) / 2

  const drawTableHeader = (topY: number) => {
    doc.setFillColor(37, 99, 235)
    doc.rect(tableStartX, topY, tableWidth, 10, "F")
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(8)
    doc.setFont("helvetica", "bold")

    let hx = tableStartX
    doc.text("Aluno", hx + 3, topY + 7)
    hx += colWidths.aluno
    doc.text("Matricula", hx + 3, topY + 7)
    hx += colWidths.matricula
    for (let i = 1; i <= 4; i++) {
      doc.text(`${i}o Bim`, hx + colWidths.bimestre / 2, topY + 7, { align: "center" })
      hx += colWidths.bimestre
    }
    doc.text("Media", hx + colWidths.media / 2, topY + 7, { align: "center" })
  }

  drawTableHeader(y)
  y += 10

  doc.setTextColor(0, 0, 0)
  doc.setFont("helvetica", "normal")

  const rowHeight = 9
  const pageBreakY = 280

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
    doc.setFontSize(7)
    doc.text(aluno.nome_completo, x + 3, y + 6)
    x += colWidths.aluno
    doc.text(aluno.matricula || "-", x + 3, y + 6)
    x += colWidths.matricula

    for (let bim = 0; bim < 4; bim++) {
      const nota = aluno.notas[bim]
      doc.text(nota || "-", x + colWidths.bimestre / 2, y + 6, { align: "center" })
      x += colWidths.bimestre
    }

    doc.setFont("helvetica", "bold")
    doc.text(aluno.media, x + colWidths.media / 2, y + 6, { align: "center" })
    doc.setFont("helvetica", "normal")

    y += rowHeight
  })

  y += 20

  // Data de geracao (com hora) - usa toLocaleString para incluir horario
  const dataAtual = new Date().toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  // Garante que a mensagem nao caia fora da pagina (area em branco)
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

  const nomeArquivo = `Notas_${disciplinaNome.replace(/\s+/g, "_")}_${turmaNome.replace(/\s+/g, "_")}.pdf`
  doc.save(nomeArquivo)
}
