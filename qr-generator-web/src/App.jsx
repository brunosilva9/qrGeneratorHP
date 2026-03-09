import { useState } from "react"

import { generateCodes } from "./utils/codeGenerator"
import { buildQrImages } from "./services/qrService"
import { exportPdf } from "./services/pdfService"

import SheetPreview from "./components/SheetPreview"

export default function App(){

  const[prefix,setPrefix] = useState("")
  const[start,setStart] = useState("")
  const[end,setEnd] = useState("")

  const[cards,setCards] = useState([])

  const generate = async ()=>{

    const codes = generateCodes(prefix,start,end)

    const results = await buildQrImages(codes)

    setCards(results)

  }

  return(

    <div className="app">

      <h2>QR Card Generator</h2>

      <div className="controls">

        <input
          placeholder="Prefix"
          value={prefix}
          onChange={e=>setPrefix(e.target.value)}
        />

        <input
          placeholder="Start"
          type="number"
          value={start}
          onChange={e=>setStart(e.target.value)}
        />

        <input
          placeholder="End"
          type="number"
          value={end}
          onChange={e=>setEnd(e.target.value)}
        />

        <button onClick={generate}>
          Generate
        </button>

        <button onClick={()=>exportPdf(cards)}>
          Download PDF
        </button>

      </div>

      <SheetPreview cards={cards}/>

    </div>
  )
}