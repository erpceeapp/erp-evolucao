type Disciplina = {
  id: string
  nome: string
  codigo: string
  notas: {
    1?: { nota: number }
    2?: { nota: number }
    3?: { nota: number }
    4?: { nota: number }
  }
  media: string
}

type AlunoBoletim = {
  nome_completo: string
  matricula: string | null
  nivel: string | null
  turma?: string
  ano_letivo?: number
}

type EscolaInfo = {
  nome: string
  endereco?: string
  telefone?: string
  email?: string
}

export async function generateBoletimPDF(
  aluno: AlunoBoletim,
  disciplinas: Disciplina[],
  escola?: EscolaInfo | null
): Promise<void> {
  const { jsPDF } = await import("jspdf")

  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 15
  let y = 15

  // Cabecalho da escola
  doc.setFillColor(37, 99, 235)
  doc.rect(0, 0, pageWidth, 35, "F")
  
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.setFont("helvetica", "bold")
  doc.text(escola?.nome || "Sistema Escolar", pageWidth / 2, 15, { align: "center" })
  
  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  if (escola?.endereco) {
    doc.text(escola.endereco, pageWidth / 2, 22, { align: "center" })
  }
  if (escola?.telefone || escola?.email) {
    const contato = [escola.telefone, escola.email].filter(Boolean).join(" | ")
    doc.text(contato, pageWidth / 2, 28, { align: "center" })
  }

  y = 45

  // Titulo do boletim
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(16)
  doc.setFont("helvetica", "bold")
  doc.text("BOLETIM ESCOLAR", pageWidth / 2, y, { align: "center" })
  y += 10

  // Dados do aluno
  doc.setFillColor(245, 245, 245)
  doc.rect(margin, y, pageWidth - 2 * margin, 25, "F")
  doc.setDrawColor(200, 200, 200)
  doc.rect(margin, y, pageWidth - 2 * margin, 25, "S")

  y += 8
  doc.setFontSize(10)
  doc.setFont("helvetica", "bold")
  doc.text("Aluno:", margin + 5, y)
  doc.setFont("helvetica", "normal")
  doc.text(aluno.nome_completo || "-", margin + 25, y)

  doc.setFont("helvetica", "bold")
  doc.text("Matricula:", pageWidth / 2, y)
  doc.setFont("helvetica", "normal")
  doc.text(aluno.matricula || "-", pageWidth / 2 + 25, y)

  y += 8
  doc.setFont("helvetica", "bold")
  doc.text("Serie:", margin + 5, y)
  doc.setFont("helvetica", "normal")
  doc.text(aluno.nivel || "-", margin + 25, y)

  if (aluno.turma) {
    doc.setFont("helvetica", "bold")
    doc.text("Turma:", pageWidth / 2, y)
    doc.setFont("helvetica", "normal")
    doc.text(aluno.turma, pageWidth / 2 + 25, y)
  }

  if (aluno.ano_letivo) {
    doc.setFont("helvetica", "bold")
    doc.text("Ano Letivo:", pageWidth - 50, y)
    doc.setFont("helvetica", "normal")
    doc.text(String(aluno.ano_letivo), pageWidth - 25, y)
  }

  y += 20

  // Tabela de notas
  const colWidths = {
    disciplina: 60,
    bimestre: 22,
    media: 25,
  }

  const tableWidth = colWidths.disciplina + colWidths.bimestre * 4 + colWidths.media
  const tableStartX = (pageWidth - tableWidth) / 2

  // Cabecalho da tabela
  doc.setFillColor(37, 99, 235)
  doc.rect(tableStartX, y, tableWidth, 10, "F")
  
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(9)
  doc.setFont("helvetica", "bold")

  let x = tableStartX
  doc.text("Disciplina", x + 3, y + 7)
  x += colWidths.disciplina

  for (let i = 1; i <= 4; i++) {
    doc.text(`${i}o Bim`, x + colWidths.bimestre / 2, y + 7, { align: "center" })
    x += colWidths.bimestre
  }

  doc.text("Media", x + colWidths.media / 2, y + 7, { align: "center" })

  y += 10

  // Linhas da tabela
  doc.setTextColor(0, 0, 0)
  doc.setFont("helvetica", "normal")

  disciplinas.forEach((disciplina, index) => {
    const rowY = y + index * 10
    
    // Alternar cor de fundo
    if (index % 2 === 0) {
      doc.setFillColor(250, 250, 250)
      doc.rect(tableStartX, rowY, tableWidth, 10, "F")
    }

    // Borda da linha
    doc.setDrawColor(220, 220, 220)
    doc.rect(tableStartX, rowY, tableWidth, 10, "S")

    x = tableStartX
    
    // Nome da disciplina
    doc.setFontSize(8)
    const nomeAbreviado = disciplina.nome.length > 20 
      ? disciplina.nome.substring(0, 20) + "..." 
      : disciplina.nome
    doc.text(nomeAbreviado, x + 3, rowY + 7)
    x += colWidths.disciplina

    // Notas por bimestre
    for (let bim = 1; bim <= 4; bim++) {
      const nota = disciplina.notas[bim as 1 | 2 | 3 | 4]
      const notaText = nota ? Number(nota.nota).toFixed(1) : "-"
      
      // Cor da nota
      if (nota) {
        const notaNum = Number(nota.nota)
        if (notaNum >= 7) {
          doc.setTextColor(22, 163, 74) // verde
        } else if (notaNum >= 5) {
          doc.setTextColor(202, 138, 4) // amarelo
        } else {
          doc.setTextColor(220, 38, 38) // vermelho
        }
      } else {
        doc.setTextColor(156, 163, 175) // cinza
      }
      
      doc.text(notaText, x + colWidths.bimestre / 2, rowY + 7, { align: "center" })
      x += colWidths.bimestre
    }

    // Media
    doc.setTextColor(0, 0, 0)
    doc.setFont("helvetica", "bold")
    
    if (disciplina.media !== "-") {
      const mediaNum = Number(disciplina.media)
      if (mediaNum >= 7) {
        doc.setTextColor(22, 163, 74)
      } else if (mediaNum >= 5) {
        doc.setTextColor(202, 138, 4)
      } else {
        doc.setTextColor(220, 38, 38)
      }
    }
    
    doc.text(disciplina.media, x + colWidths.media / 2, rowY + 7, { align: "center" })
    doc.setFont("helvetica", "normal")
    doc.setTextColor(0, 0, 0)
  })

  y += disciplinas.length * 10 + 15

  // Legenda
  doc.setFontSize(8)
  doc.setTextColor(100, 100, 100)
  doc.text("Legenda: ", margin, y)
  
  doc.setFillColor(22, 163, 74)
  doc.rect(margin + 20, y - 3, 8, 4, "F")
  doc.text("Aprovado (>=7)", margin + 30, y)
  
  doc.setFillColor(202, 138, 4)
  doc.rect(margin + 70, y - 3, 8, 4, "F")
  doc.text("Recuperacao (5-6.9)", margin + 80, y)
  
  doc.setFillColor(220, 38, 38)
  doc.rect(margin + 135, y - 3, 8, 4, "F")
  doc.text("Reprovado (<5)", margin + 145, y)

  y += 25

  // Area de assinaturas
  if (y > 240) {
    doc.addPage()
    y = 30
  }

  doc.setDrawColor(0, 0, 0)
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(9)

  // Linha do responsavel
  doc.line(margin, y, margin + 70, y)
  doc.text("Assinatura do Responsavel", margin, y + 5)

  // Linha da escola
  doc.line(pageWidth - margin - 70, y, pageWidth - margin, y)
  doc.text("Carimbo e Assinatura da Escola", pageWidth - margin - 70, y + 5)

  y += 15

  // Data
  const dataAtual = new Date().toLocaleDateString("pt-BR")
  doc.text(`Emitido em: ${dataAtual}`, pageWidth / 2, y, { align: "center" })

  // Rodape
  doc.setFontSize(7)
  doc.setTextColor(150, 150, 150)
  doc.text(
    "Este documento e valido sem rasuras. Qualquer alteracao invalida este boletim.",
    pageWidth / 2,
    doc.internal.pageSize.getHeight() - 10,
    { align: "center" }
  )

  // Salvar o PDF
  const nomeArquivo = `Boletim_${aluno.nome_completo?.replace(/\s+/g, "_") || "aluno"}.pdf`
  doc.save(nomeArquivo)
}
