"use client"

import domtoimage from "dom-to-image-more"
import { jsPDF } from "jspdf"
import { Button } from "@/components/ui/button"
import { FileDown } from "lucide-react"
import { toast } from "sonner"
import { translateError } from "@/lib/error-messages"
import { useState } from "react"

interface ExportGradePDFProps {
  wrapperRef: React.RefObject<HTMLDivElement | null>
  filtroTipo: "turma" | "professor"
  filtroNome?: string
}

export function ExportGradePDF({ wrapperRef, filtroTipo, filtroNome }: ExportGradePDFProps) {
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    if (exporting) return
    setExporting(true)

    const wrapper = wrapperRef.current
    if (!wrapper) {
      toast.error("Grade ainda não carregada.")
      setExporting(false)
      return
    }

    const toastId = toast.loading("Gerando PDF...")

    try {
      const dataUrl = await domtoimage.toPng(wrapper, {
        width: wrapper.scrollWidth,
        height: wrapper.scrollHeight,
        scale: 2,
        bgcolor: "#ffffff",
      })

      const pdf = new jsPDF("landscape", "mm", "a4")
      const pw = pdf.internal.pageSize.getWidth()
      const ph = pdf.internal.pageSize.getHeight()

      pdf.setFontSize(16)
      pdf.text("Grade de Horarios", 14, 20)
      if (filtroNome) {
        pdf.setFontSize(11)
        const l = filtroTipo === "turma" ? "Turma" : "Professor"
        pdf.text(`${l}: ${filtroNome}`, 14, 28)
      }

      const ratio = wrapper.scrollWidth / wrapper.scrollHeight
      const mw = pw - 28
      const mh = ph - 40
      let iw = mw
      let ih = iw / ratio
      if (ih > mh) { ih = mh; iw = ih * ratio }
      pdf.addImage(dataUrl, "PNG", (pw - iw) / 2, 38, iw, ih)

      const blob = pdf.output("blob")
      const url = URL.createObjectURL(blob)
      window.open(url, "_blank")
      setTimeout(() => URL.revokeObjectURL(url), 10000)

      toast.success("PDF exportado com sucesso!", { id: toastId })
    } catch (err: any) {
      toast.error(translateError(err?.message || "Erro ao exportar PDF"), { id: toastId })
    } finally {
      setExporting(false)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting}>
      <FileDown className="h-4 w-4 mr-2" />
      {exporting ? "Exportando..." : "Exportar PDF"}
    </Button>
  )
}
