import { jsPDF } from "jspdf"

export async function exportPdf(cards){

  const pdf = new jsPDF({
    orientation:"portrait",
    unit:"mm",
    format:"a4"
  })

  const cols = 3
  const rows = 3
  const perPage = cols * rows

  const cardW = 60
  const cardH = 80

  const pageW = 210
  const pageH = 297

  const offsetX = (pageW - cols * cardW) / 2
  const offsetY = (pageH - rows * cardH) / 2

  const logo = await fetch(`${import.meta.env.BASE_URL}logo.png`)
    .then(r => r.blob())  
  const logoURL = URL.createObjectURL(logo)

  // Dibujar líneas de corte en la primera página (y en cada página nueva)
  const drawCutLines = () => {
    pdf.setDrawColor(180, 180, 180)
    pdf.setLineWidth(0.15)
    pdf.setLineDashPattern([2, 2], 0)

    // Líneas verticales (borde izquierdo, entre columnas, borde derecho)
    for (let c = 0; c <= cols; c++) {
      const lineX = offsetX + (c * cardW)
      pdf.line(lineX, 0, lineX, pageH)
    }

    // Líneas horizontales (borde superior, entre filas, borde inferior)
    for (let r = 0; r <= rows; r++) {
      const lineY = offsetY + (r * cardH)
      pdf.line(0, lineY, pageW, lineY)
    }

    // Restauramos el estilo para las tarjetas
    pdf.setLineDashPattern([], 0)
    pdf.setLineWidth(0.3)
  }

  // Dibujar líneas de corte en la primera página
  drawCutLines()

  cards.forEach((card,i)=>{

    const pageIndex = Math.floor(i / perPage)
    const position = i % perPage

    if(i !== 0 && position === 0){
      pdf.addPage()
      // Dibujar líneas de corte en cada nueva página
      drawCutLines()
    }

    const col = position % cols
    const row = Math.floor(position / cols)

    const x = offsetX + col * cardW
    const y = offsetY + row * cardH

    /* card border con bordes suavizados */
    pdf.setFillColor(255, 255, 255)
    pdf.setDrawColor(200, 200, 200)
    pdf.setLineWidth(0.3)
    pdf.roundedRect(x, y, cardW, cardH, 2, 2, 'FD')

    /* QR con borde suavizado */
    pdf.setFillColor(250, 250, 250)
    pdf.setDrawColor(220, 220, 220)
    pdf.roundedRect(x+5, y+5, 50, 50, 2, 2, 'FD')
    
    pdf.addImage(
      card.qr,
      "PNG",
      x+7,
      y+8,
      46,
      46
    )

    /* label con bordes suavizados (rectángulo con esquinas redondeadas suaves) */
    const labelY = y + cardH - 22
    const labelW = cardW - 12
    const labelH = 16
    
    pdf.setFillColor(240, 240, 240)
    pdf.setDrawColor(180, 180, 180)
    pdf.roundedRect(
      x+6,
      labelY,
      labelW,
      labelH,
      3,
      3,
      'FD'
    )

    /* logo integrado directamente en el label */
    pdf.addImage(
      logoURL,
      "PNG",
      x+9,
      labelY+3,
      10,
      10
    )

    /* code - ajustado para que quede al lado del logo */
    pdf.setFontSize(12)
    pdf.setTextColor(50, 50, 50)
    pdf.text(
      card.code,
      x + 22,
      labelY + 11
    )

  })

  pdf.save("qr-cards.pdf")
}