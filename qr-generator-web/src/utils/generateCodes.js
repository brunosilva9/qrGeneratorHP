export function generateCodes(prefix, start, end) {

  const cleanPrefix = prefix
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, 2)

  const codes = []

  for (let i = start; i <= end; i++) {

    const number = String(i).padStart(2,"0")

    codes.push(`${cleanPrefix}-${number}`)

  }

  return codes
}