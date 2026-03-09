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

  cards.forEach((card,i)=>{

    const pageIndex = Math.floor(i / perPage)
    const position = i % perPage

    if(i !== 0 && position === 0){
      pdf.addPage()
    }

    const col = position % cols
    const row = Math.floor(position / cols)

    const x = offsetX + col * cardW
    const y = offsetY + row * cardH

    /* card border */

    pdf.rect(x,y,cardW,cardH)

    /* QR */

    pdf.addImage(
      card.qr,
      "PNG",
      x+7,
      y+8,
      46,
      46
    )

    /* label */

    const labelY = y + cardH - 22

    pdf.rect(
      x+5,
      labelY,
      cardW-10,
      16
    )

    /* logo */

    pdf.addImage(
      logoURL,
      "PNG",
      x+7,
      labelY+3,
      10,
      10
    )

    /* code */

    pdf.setFontSize(14)

    pdf.text(
      card.code,
      x + cardW/2 + 6,
      labelY + 11,
      {align:"center"}
    )

  })

  pdf.save("qr-cards.pdf")
}