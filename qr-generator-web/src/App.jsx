import { useState } from "react"
import { generateCodes } from "./utils/codeGenerator"
import { buildQrImages } from "./services/qrService"
import { exportPdf } from "./services/pdfService"
import SheetPreview from "./components/SheetPreview"
import "./App.css"

export default function App(){

  const[prefix,setPrefix] = useState("")
  const[start,setStart] = useState("")
  const[end,setEnd] = useState("")
  const[cards,setCards] = useState([])
  const[isLoading,setIsLoading] = useState(false)
  const[error,setError] = useState("")

  const generate = async ()=>{
    
    // Validaciones
    if(!prefix.trim()){
      setError("Por favor ingresa un prefijo")
      return
    }
    
    const startNum = Number(start)
    const endNum = Number(end)
    
    if(!start || !end){
      setError("Por favor ingresa los números de inicio y fin")
      return
    }
    
    if(startNum > endNum){
      setError("El número de inicio debe ser menor o igual al final")
      return
    }
    
    // Límite aumentado a 200 códigos
    const totalCodes = endNum - startNum + 1
    if(totalCodes > 200){
      setError(`El máximo permitido es 200 códigos. Has solicitado ${totalCodes} códigos.`)
      return
    }
    
    setError("")
    setIsLoading(true)
    
    try {
      const codes = generateCodes(prefix, start, end)
      const results = await buildQrImages(codes)
      setCards(results)
    } catch (err) {
      setError("Error al generar los códigos QR")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = () => {
    if(cards.length === 0){
      setError("Primero genera algunos códigos QR")
      return
    }
    exportPdf(cards)
  }

  const clearAll = () => {
    setPrefix("")
    setStart("")
    setEnd("")
    setCards([])
    setError("")
  }

  return(
    <div className="app">
      
      <header className="app-header">
        <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Logo" className="app-logo" />
        <h1>Generador de Tarjetas QR</h1>
        <p className="app-subtitle">Crea hasta 200 códigos QR personalizados con tu prefijo</p>
      </header>

      <div className="controls-container">
        
        <div className="input-group">
          <label htmlFor="prefix">Prefijo:</label>
          <input
            id="prefix"
            type="text"
            placeholder="Ej: AA, EMP, PROD"
            value={prefix}
            onChange={e => setPrefix(e.target.value.toUpperCase())}
            maxLength="10"
          />
          <small>Máximo 10 caracteres</small>
        </div>

        <div className="input-row">
          <div className="input-group">
            <label htmlFor="start">Número inicial:</label>
            <input
              id="start"
              type="number"
              placeholder="Ej: 1"
              value={start}
              onChange={e => setStart(e.target.value)}
              min="1"
              max="9999"
            />
          </div>

          <div className="input-group">
            <label htmlFor="end">Número final:</label>
            <input
              id="end"
              type="number"
              placeholder="Ej: 10"
              value={end}
              onChange={e => setEnd(e.target.value)}
              min="1"
              max="9999"
            />
          </div>
        </div>

        {error && (
          <div className="error-message">
            ⚠️ {error}
          </div>
        )}

        <div className="button-group">
          <button 
            onClick={generate} 
            disabled={isLoading}
            className="primary-button"
          >
            {isLoading ? (
              <>
                <span className="spinner"></span>
                Generando...
              </>
            ) : (
              "Generar QR"
            )}
          </button>

          <button 
            onClick={handleDownload}
            disabled={cards.length === 0}
            className="secondary-button"
          >
            📥 Descargar PDF
          </button>

          <button 
            onClick={clearAll}
            className="tertiary-button"
            title="Limpiar todo"
          >
            🗑️ Limpiar
          </button>
        </div>

        {cards.length > 0 && (
          <div className="stats">
            <span>📊 {cards.length} código{cards.length !== 1 ? 's' : ''} generado{cards.length !== 1 ? 's' : ''}</span>
            <span>🔤 Prefijo: {prefix}</span>
            <span>📋 Rango: {start} - {end}</span>
          </div>
        )}
      </div>

      {cards.length > 0 ? (
        <div className="preview-section">
          <h2>Vista previa</h2>
          <p className="preview-note">Mostrando las primeras 9 tarjetas de {cards.length}</p>
          <SheetPreview cards={cards}/>
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">🎯</div>
          <h3>¡Comienza a generar!</h3>
          <p>Ingresa un prefijo y un rango de números para crear tus tarjetas QR personalizadas</p>
        </div>
      )}

    </div>
  )
}