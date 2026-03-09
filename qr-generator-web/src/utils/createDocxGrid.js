import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  ImageRun,
  AlignmentType,
  WidthType,
  HeightRule,
  VerticalAlign
} from "docx";

/**
 * Conversión mm -> twips
 * 1 mm ≈ 56.7 twips
 */
const mm = (v) => Math.round(v * 56.7);

// Configuración exacta pedida
const PAGE_MARGIN = mm(10);   // 10 mm
const CARD_W = mm(60);        // 60 mm
const CARD_H = mm(90);        // 90 mm
const QR = mm(45);            // 45 mm
const LOGO = mm(10);          // 10 mm

export async function createDocxGrid(qrs) {
  const logoBuffer = await fetch("/logo.png").then(r => r.arrayBuffer());

  const rows = [];
  const COLS = 3;

  for (let i = 0; i < qrs.length; i += COLS) {
    const slice = qrs.slice(i, i + COLS);

    const cells = await Promise.all(slice.map(async (item) => {
      const qrBuffer = await fetch(item.qr).then(r => r.arrayBuffer());

      return new TableCell({
        width: { size: CARD_W, type: WidthType.DXA },
        verticalAlign: VerticalAlign.CENTER,
        children: [

          // QR centrado
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new ImageRun({
                data: qrBuffer,
                transformation: { width: QR, height: QR }
              })
            ]
          }),

          // espacio
          new Paragraph({ text: "" }),

          // logo + código
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new ImageRun({
                data: logoBuffer,
                transformation: { width: LOGO, height: LOGO }
              })
            ]
          }),

          new Paragraph({
            text: item.code,
            alignment: AlignmentType.CENTER
          })
        ]
      });
    }));

    // si faltan celdas para completar 3 columnas
    while (cells.length < COLS) {
      cells.push(new TableCell({ children: [new Paragraph("")] }));
    }

    rows.push(
      new TableRow({
        height: { value: CARD_H, rule: HeightRule.EXACT },
        children: cells
      })
    );
  }

  const table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows
  });

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: PAGE_MARGIN,
              bottom: PAGE_MARGIN,
              left: PAGE_MARGIN,
              right: PAGE_MARGIN
            }
          }
        },
        children: [table]
      }
    ]
  });

  return await Packer.toBlob(doc);
}