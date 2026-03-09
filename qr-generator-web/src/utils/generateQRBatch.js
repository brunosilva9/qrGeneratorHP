import QRCode from "qrcode";

export async function generateQRBatch(codes) {
  const out = [];
  for (const code of codes) {
    const qr = await QRCode.toDataURL(code, { margin: 1, width: 800 });
    out.push({ code, qr });
  }
  return out;
}