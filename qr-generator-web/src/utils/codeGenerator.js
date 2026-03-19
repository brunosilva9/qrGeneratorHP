export function generateCodes(prefix, start, end) {
  const clean = prefix
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, 2);

  const codes = [];
  const startNum = Number(start);
  const endNum = Number(end);

  for (let i = startNum; i <= endNum; i++) {
    const code = `${clean}-${i}`;
    codes.push(code);
  }

  return codes;
}
