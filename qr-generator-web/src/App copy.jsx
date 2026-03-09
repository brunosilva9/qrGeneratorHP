import { useState } from "react"
import { generateCodes } from "./utils/generateCodes"
import { generateQrImage } from "./services/qrService"
import SheetPreview from "./components/SheetPreview"
import { generatePdf } from "./services/pdfService"

export default function App() {

  const [prefix, setPrefix] = useState("")
  const [start, setStart] = useState("")
  const [end, setEnd] = useState("")
  const [items, setItems] = useState([])

  const handleGenerate = async () => {

    const codes = generateCodes(
      prefix,
      Number(start),
      Number(end)
    )

    const results = []

    for (const code of codes) {

      const qr = await generateQrImage(code)

      results.push({
        code,
        qr
      })

    }

    setItems(results)
  }

  return (

    <div className="app">

      <h2>QR Card Generator</h2>

      <div className="controls">

        <input
          placeholder="Prefix (AA)"
          value={prefix}
          onChange={e => setPrefix(e.target.value)}
        />

        <input
          type="number"
          placeholder="Start"
          value={start}
          onChange={e => setStart(e.target.value)}
        />

        <input
          type="number"
          placeholder="End"
          value={end}
          onChange={e => setEnd(e.target.value)}
        />

        <button onClick={handleGenerate}>
          Generate
        </button>

      </div>

      {items.length > 0 && (
        <SheetPreview items={items} />
      )}
      <button
        onClick={() => generatePdf(items)}
      >
        Download PDF
      </button>

    </div>
  )
}