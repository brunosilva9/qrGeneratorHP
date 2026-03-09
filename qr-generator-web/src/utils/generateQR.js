import QRCode from "qrcode"

export async function generateQR(text) {
  return await QRCode.toDataURL(text, {
    width: 500,
    margin: 1
  })
}