import QRCode from "qrcode"

export async function buildQrImages(codes){

  const results = []

  for(const code of codes){

    const qr = await QRCode.toDataURL(code,{
      type:"image/png",
      margin:1,
      width:400
    })

    results.push({
      code,
      qr
    })
  }

  return results
}