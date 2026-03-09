import { jsPDF } from "jspdf"
import QRCode from "qrcode"

export async function createPDF(codes){

  const pdf = new jsPDF({
    orientation:"portrait",
    unit:"mm",
    format:"a4"
  })

  const cardWidth = 60
  const cardHeight = 90

  const qrSize = 45
  const logoSize = 10

  const marginX = 10
  const marginY = 10

  const logo = await fetch("/logo.png").then(r=>r.blob())
  const logoURL = URL.createObjectURL(logo)

  pdf.setDrawColor(180)

  for(let i=0;i<codes.length;i++){

    const col = i % 3
    const row = Math.floor(i/3) % 3

    const x = marginX + col * cardWidth
    const y = marginY + row * cardHeight

    // líneas de corte (rectángulo)
    pdf.rect(x,y,cardWidth,cardHeight)

    const qr = await QRCode.toDataURL(codes[i])

    pdf.addImage(
      qr,
      "PNG",
      x + (cardWidth-qrSize)/2,
      y + 10,
      qrSize,
      qrSize
    )

    pdf.addImage(
      logoURL,
      "PNG",
      x + 6,
      y + cardHeight - 15,
      logoSize,
      logoSize
    )

    pdf.setFontSize(12)

    pdf.text(
      codes[i],
      x + cardWidth/2,
      y + cardHeight - 8,
      {align:"center"}
    )

    if((i+1)%9===0 && i<codes.length-1){
      pdf.addPage()
    }

  }

  return pdf.output("blob")
}