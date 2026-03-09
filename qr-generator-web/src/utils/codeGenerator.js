export function generateCodes(prefix, start, end) {

  const clean = prefix
    .toUpperCase()
    .replace(/[^A-Z]/g,"")
    .slice(0,2)

  const codes = []

  for(let i=start;i<=end;i++){

    const num = String(i).padStart(2,"0")

    codes.push(`${clean}-${num}`)
  }

  return codes
}