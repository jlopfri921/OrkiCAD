import React, { useState } from 'react'
import { createRoot } from 'react-dom/client'
import './style.css'
import STLViewer from './STLViewer'

type PartType = 'washer' | 'mounting_plate' | 'open_box' | 'metric_screw' | 'metric_nut' | 'spur_gear'
type Definition = { label: string; params: Record<string, number | string> }
const catalog: Record<PartType, Definition> = {
  washer: { label: 'Washer', params: { outer_diameter: 18, inner_diameter: 6.5, thickness: 2 } },
  mounting_plate: { label: 'Mounting plate', params: { width: 80, depth: 50, thickness: 5, hole_diameter: 5, hole_inset: 10 } },
  open_box: { label: 'Open box', params: { width: 60, depth: 40, height: 25, wall: 2 } },
  metric_screw: { label: 'Metric screw', params: { diameter: 6, pitch: 1, length: 30, head: 'socket', drive: 'hex' } },
  metric_nut: { label: 'Metric nut', params: { diameter: 6, pitch: 1, shape: 'hex', thickness: 'normal' } },
  spur_gear: { label: 'Spur gear', params: { module: 2, teeth: 24, thickness: 8, shaft_diameter: 8, pressure_angle: 20 } }
}

function App() {
  const [type, setType] = useState<PartType>('washer')
  const [params, setParams] = useState<Record<string, number | string>>(catalog.washer.params)
  const [scad, setScad] = useState('')
  const [stl, setStl] = useState<ArrayBuffer | null>(null)
  const [error, setError] = useState('')
  const [working, setWorking] = useState(false)
  function changeType(next: PartType) {
    setType(next); setParams({ ...catalog[next].params }); setScad(''); setStl(null); setError('')
  }
  async function generate() {
    setWorking(true); setError('')
    try {
      const response = await fetch('/api/scad', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'X-OrkiCAD-Client': 'studio' },
        body: JSON.stringify({ type, ...params })
      })
      const contentType = response.headers.get('content-type') ?? ''
      const text = await response.text()
      if (!text.trim()) {
        throw new Error(
          `El servidor CAD no devolvió datos (HTTP ${response.status}). ` +
          'Comprueba que el servidor Python está abierto en http://127.0.0.1:8765/api/health'
        )
      }
      if (!contentType.includes('application/json')) {
        throw new Error(
          `Respuesta inesperada del servidor (HTTP ${response.status}, tipo: ${contentType || 'desconocido'}). ` +
          'Comprueba el servidor Python y la consola de Vite.'
        )
      }
      let body: { error?: string; scad?: string }
      try {
        body = JSON.parse(text)
      } catch {
        throw new Error(
          `El servidor devolvió JSON no válido (HTTP ${response.status}). ` +
          'Revisa la consola del servidor Python.'
        )
      }
      if (!response.ok) throw new Error(body.error || `Error HTTP ${response.status}`)
      if (typeof body.scad !== 'string' || !body.scad.trim()) {
        throw new Error('El servidor CAD no devolvió ningún modelo SCAD.')
      }
      setScad(body.scad)
    } catch (e) {
      setScad(''); setError(e instanceof Error ? e.message : String(e))
    } finally {
      setWorking(false)
    }
  }
  async function renderSTL() {
    setWorking(true); setError(''); setStl(null)
    try {
      const response = await fetch('/api/stl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-OrkiCAD-Client': 'studio' },
        body: JSON.stringify({ type, ...params })
      })
      if (!response.ok) {
        const raw = await response.text()
        let detail = raw.slice(0, 400)
        try {
          const json = JSON.parse(raw) as { error?: string }
          detail = json.error || detail
        } catch { /* Non-JSON proxy errors are still displayed */ }
        throw new Error(detail || `No se pudo generar STL: HTTP ${response.status}`)
      }
      const typeHeader = response.headers.get('content-type') || ''
      if (!typeHeader.includes('model/stl') && !typeHeader.includes('application/octet-stream')) {
        throw new Error(`El servidor no devolvió STL (tipo: ${typeHeader || 'desconocido'}).`)
      }
      const buffer = await response.arrayBuffer()
      if (buffer.byteLength < 84) throw new Error('El archivo STL recibido está vacío o incompleto.')
      setStl(buffer)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setWorking(false)
    }
  }
  function downloadSTL() {
    if (!stl) return
    const blob = new Blob([stl], { type: 'model/stl' })
    const link = document.createElement('a')
    const uri = URL.createObjectURL(blob)
    link.href = uri
    link.download = `orkicad_${type}.stl`
    link.click()
    setTimeout(() => URL.revokeObjectURL(uri), 1000)
  }
  function download() {
    if (!scad) return
    const blob = new Blob([scad], { type: 'text/plain;charset=utf-8' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `orkicad_${type}.scad`
    link.click()
    URL.revokeObjectURL(link.href)
  }
  return <main className="layout">
    <header><div className="brand">◈ <strong>OrkiCAD</strong> <span>AI</span></div><small>Studio · CAD core prototype</small></header>
    <section className="intro"><h1>Parametric CAD Studio</h1><p>Configure a component and generate real OpenSCAD source through the shared OrkiCAD Python core.</p></section>
    <div className="workbench"><section className="panel">
      <h2>Component</h2>
      <label htmlFor="type">Part type</label>
      <select id="type" value={type} onChange={e => changeType(e.target.value as PartType)}>{Object.entries(catalog).map(([id, def]) => <option key={id} value={id}>{def.label}</option>)}</select>
      <h2>Dimensions and parameters</h2>
      <div className="fields">{Object.entries(params).map(([name, value]) => <div key={name}><label htmlFor={name}>{name.replace(/_/g, ' ')}</label><input id={name} type={typeof value === 'number' ? 'number' : 'text'} step={name === 'teeth' || name === 'diameter' ? '1' : 'any'} value={value} onChange={e => setParams(p => ({ ...p, [name]: typeof value === 'number' ? e.target.value === '' ? 0 : Number(e.target.value) : e.target.value }))} /></div>)}</div>
      <div className="actions"><button disabled={working} onClick={generate}>{working ? 'Procesando…' : 'Generar SCAD'}</button><button disabled={working} onClick={renderSTL}>{working ? 'Procesando…' : 'Generar STL y ver en 3D'}</button></div>
      {error && <p className="error" role="alert">{error}</p>}
      </section><section className="panel output"><h2>Visor 3D</h2><STLViewer data={stl} /><p className="hint">Gira la pieza arrastrando el ratón; usa la rueda para ampliar. Requiere OpenSCAD y BOSL2 para las piezas mecánicas.</p><button className="secondary" disabled={!stl} onClick={downloadSTL}>Descargar STL</button><h2>Código OpenSCAD</h2>
      <pre>{scad || 'Choose a part and click Generate SCAD. The local Python server must be running.'}</pre>
      <button className="secondary" disabled={!scad} onClick={download}>Download .scad</button>
      </section></div>
    <footer>Prototype · Units: millimetres · Validate geometry and manufacturing clearances before printing.</footer>
  </main>
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>)
