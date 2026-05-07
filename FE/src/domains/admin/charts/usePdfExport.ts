import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { useCallback } from 'react'

type ExportMeta = {
  title: string
  subtitle?: string
}

async function canvasFromNode(node: HTMLElement) {
  return html2canvas(node, {
    backgroundColor: '#ffffff',
    scale: 2,
    useCORS: true,
  })
}

export function usePdfExport() {
  const exportSingleChartPdf = useCallback(async (node: HTMLElement | null, meta: ExportMeta) => {
    if (!node) return
    const canvas = await canvasFromNode(node)
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
    const pageW = pdf.internal.pageSize.getWidth()
    const pageH = pdf.internal.pageSize.getHeight()
    const margin = 24
    const imgW = pageW - margin * 2
    const imgH = (canvas.height * imgW) / canvas.width

    pdf.setFontSize(14)
    pdf.text(meta.title, margin, 24)
    if (meta.subtitle) {
      pdf.setFontSize(10)
      pdf.text(meta.subtitle, margin, 40)
    }
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', margin, 52, imgW, Math.min(imgH, pageH - 70))
    pdf.save(`${meta.title.toLowerCase().replace(/\s+/g, '-')}.pdf`)
  }, [])

  const exportPageChartsPdf = useCallback(async (nodes: Array<HTMLElement | null>, meta: ExportMeta) => {
    const valid = nodes.filter((n): n is HTMLElement => !!n)
    if (!valid.length) return
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
    const pageW = pdf.internal.pageSize.getWidth()
    const pageH = pdf.internal.pageSize.getHeight()
    const margin = 24

    for (let i = 0; i < valid.length; i += 1) {
      const canvas = await canvasFromNode(valid[i])
      if (i > 0) pdf.addPage()
      const imgW = pageW - margin * 2
      const imgH = (canvas.height * imgW) / canvas.width
      pdf.setFontSize(14)
      pdf.text(`${meta.title} (${i + 1}/${valid.length})`, margin, 24)
      if (meta.subtitle) {
        pdf.setFontSize(10)
        pdf.text(meta.subtitle, margin, 40)
      }
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', margin, 52, imgW, Math.min(imgH, pageH - 70))
    }

    pdf.save(`${meta.title.toLowerCase().replace(/\s+/g, '-')}-all-charts.pdf`)
  }, [])

  return { exportSingleChartPdf, exportPageChartsPdf }
}

