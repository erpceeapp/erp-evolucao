export interface AlunoPorTurmaLinha {
  nome_completo: string
  matricula: string | null
  cpf: string | null
  data_nascimento: string | null
}

export interface AlunosPorTurmaPDFInput {
  turmaNome: string
  turmaSerie: string | null
  turno: string | null
  anoLetivo: number | null
  alunos: AlunoPorTurmaLinha[]
}

function formatDateSafe(dateString: string | null): string | null {
  if (!dateString) return null
  const [year, month, day] = dateString.split("-")
  if (!year || !month || !day) return null
  return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`
}

export async function generateAlunosPorTurmaPDF(input: AlunosPorTurmaPDFInput): Promise<void> {
  const { jsPDF } = await import("jspdf")

  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20

  // Cabeçalho azul
  doc.setFillColor(37, 99, 235)
  doc.rect(0, 0, pageWidth, 35, "F")
  doc.setTextColor(255, 255, 255)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(16)
  doc.text("RELATORIO DE ALUNOS POR TURMA", pageWidth / 2, 16, { align: "center" })

  const subtitulo = `${input.turmaNome}${input.turmaSerie ? " - " + input.turmaSerie : ""}${input.turno ? " (" + input.turno + ")" : ""}`
  doc.setFontSize(11)
  doc.setFont("helvetica", "normal")
  doc.text(subtitulo, pageWidth / 2, 26, { align: "center" })

  doc.setTextColor(0, 0, 0)

  let y = 45

  // Informações da turma
  doc.setFontSize(9)
  doc.setFont("helvetica", "bold")
  doc.text("Turma:", margin, y)
  doc.setFont("helvetica", "normal")
  doc.text(input.turmaNome, margin + 30, y)
  y += 6

  doc.setFont("helvetica", "bold")
  doc.text("Serie:", margin, y)
  doc.setFont("helvetica", "normal")
  doc.text(input.turmaSerie || "-", margin + 30, y)
  y += 6

  doc.setFont("helvetica", "bold")
  doc.text("Turno:", margin, y)
  doc.setFont("helvetica", "normal")
  doc.text(input.turno || "-", margin + 30, y)
  y += 6

  doc.setFont("helvetica", "bold")
  doc.text("Ano Letivo:", margin, y)
  doc.setFont("helvetica", "normal")
  doc.text(input.anoLetivo ? String(input.anoLetivo) : "-", margin + 30, y)
  y += 6

  doc.setFont("helvetica", "bold")
  doc.text("Total de Alunos:", margin, y)
  doc.setFont("helvetica", "normal")
  doc.text(String(input.alunos.length), margin + 30, y)
  y += 14

  // Colunas da tabela
  const colWidths = { nome: 85, matricula: 30, cpf: 35, nascimento: 34 }
  const tableWidth = colWidths.nome + colWidths.matricula + colWidths.cpf + colWidths.nascimento
  const tableStartX = (pageWidth - tableWidth) / 2

  function drawTableHeader(topY: number) {
    doc.setFillColor(37, 99, 235)
    doc.rect(tableStartX, topY, tableWidth, 8, "F")
    doc.setTextColor(255, 255, 255)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(8)
    let x = tableStartX
    doc.text("Aluno", x + 3, topY + 5.5)
    x += colWidths.nome
    doc.text("Matricula", x + 3, topY + 5.5)
    x += colWidths.matricula
    doc.text("CPF", x + 3, topY + 5.5)
    x += colWidths.cpf
    doc.text("Nascimento", x + 3, topY + 5.5)
  }

  drawTableHeader(y)
  y += 8

  doc.setTextColor(0, 0, 0)
  doc.setFont("helvetica", "normal")

  const rowHeight = 9
  const pageBreakY = pageHeight - 25

  input.alunos.forEach((aluno, index) => {
    if (y + rowHeight > pageBreakY) {
      doc.addPage()
      y = 20
      drawTableHeader(y)
      y += 8
      doc.setTextColor(0, 0, 0)
      doc.setFont("helvetica", "normal")
    }

    if (index % 2 === 0) {
      doc.setFillColor(250, 250, 250)
      doc.rect(tableStartX, y, tableWidth, rowHeight, "F")
    }

    doc.setDrawColor(220, 220, 220)
    doc.rect(tableStartX, y, tableWidth, rowHeight)

    doc.setFontSize(7)
    let x = tableStartX
    doc.text(aluno.nome_completo, x + 3, y + 5.5)
    x += colWidths.nome
    doc.text(aluno.matricula || "-", x + 3, y + 5.5)
    x += colWidths.matricula
    doc.text(aluno.cpf || "-", x + 3, y + 5.5)
    x += colWidths.cpf
    doc.text(formatDateSafe(aluno.data_nascimento) || "-", x + 3, y + 5.5)

    y += rowHeight
  })

  y += 12
  if (y > pageHeight - 25) {
    doc.addPage()
    y = 20
  }

  // Data de geração
  doc.setFontSize(8)
  doc.setTextColor(150, 150, 150)
  const dataGeracao = new Date().toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
  doc.text(`Documento gerado em ${dataGeracao}`, margin, pageHeight - 12)

  doc.save(`Alunos_${input.turmaNome.replace(/\s+/g, "_")}.pdf`)
}
