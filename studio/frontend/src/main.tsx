import React, { useState } from 'react'
import { createRoot } from 'react-dom/client'
import './style.css'
import STLViewer from './STLViewer'
import { initialLanguage, messages, type Language } from './i18n'
import { canonicalNumber, displayNumber, fieldUnit, usesLinearUnits, type UnitSystem } from './units'

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
  const [language, setLanguage] = useState<Language>(initialLanguage)
  const [units, setUnits] = useState<UnitSystem>('metric')
  const t = messages[language]
  const [type, setType] = useState<PartType>('washer')
  const [params, setParams] = useState<Record<string, number | string>>(catalog.washer.params)
  const [scad, setScad] = useState('')
  const [stl, setStl] = useState<ArrayBuffer | null>(null)
  const [error, setError] = useState('')
  const [working, setWorking] = useState(false)
  function updateParameter(name: string, value: number | string) {
    setParams(previous => ({ ...previous, [name]: value }))
    setScad('')
    setStl(null)
  }
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
          `${t.emptyResponse} (HTTP ${response.status}). ` + t.checkServer
        )
      }
      if (!contentType.includes('application/json')) {
        throw new Error(
          `${t.wrongResponse} (HTTP ${response.status}, ${contentType || 'unknown'}). ` + t.checkVite
        )
      }
      let body: { error?: string; scad?: string }
      try {
        body = JSON.parse(text)
      } catch {
        throw new Error(
          `${t.badJSON} (HTTP ${response.status}). ` + t.checkVite
        )
      }
      if (!response.ok) throw new Error(body.error || `Error HTTP ${response.status}`)
      if (typeof body.scad !== 'string' || !body.scad.trim()) {
        throw new Error(t.noSCAD)
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
        throw new Error(detail || `${t.noSTL}: HTTP ${response.status}`)
      }
      const typeHeader = response.headers.get('content-type') || ''
      if (!typeHeader.includes('model/stl') && !typeHeader.includes('application/octet-stream')) {
        throw new Error(`${t.wrongSTL} (${typeHeader || 'unknown'}).`)
      }
      const buffer = await response.arrayBuffer()
      if (buffer.byteLength < 84) throw new Error(t.emptySTL)
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
    <header>
      <div className="brand">◈ <strong>OrkiCAD</strong> <span>AI</span></div>
      <div className="header-controls">
        <small>{t.subtitle}</small>
        <label htmlFor="language">{t.language}</label>
        <select id="language" aria-label={t.language} value={language}
          onChange={e => setLanguage(e.target.value as Language)}>
          <option value="es">Español</option>
          <option value="en">English</option>
        </select>
        <label htmlFor="units">{t.units}</label>
        <select id="units" aria-label={t.units} value={units}
          onChange={e => setUnits(e.target.value as UnitSystem)}>
          <option value="metric">{t.metric}</option>
          <option value="imperial">{t.imperial}</option>
        </select>
      </div>
    </header>
    <section className="intro"><h1>{t.title}</h1><p>{t.intro}</p></section>
    <div className="workbench"><section className="panel">
      <h2>{t.component}</h2>
      <label htmlFor="type">{t.partType}</label>
      <select id="type" value={type} onChange={e => changeType(e.target.value as PartType)}>
        {(Object.keys(catalog) as PartType[]).map(id =>
          <option key={id} value={id}>{t.parts[id]}</option>)}
      </select>
      <h2>{t.dimensions}</h2>
      <div className="fields">{Object.entries(params).map(([name, value]) =>
        <div key={name}><label htmlFor={name}>
          {t.fields[name as keyof typeof t.fields] ?? name.replace(/_/g, ' ')}
          {fieldUnit(type, name, units) ? ` (${fieldUnit(type, name, units)})` : ''}
        </label><input id={name}
          type={typeof value === 'number' ? 'number' : 'text'}
          step={name === 'teeth' || name === 'diameter' ? '1' : 'any'}
          value={typeof value === 'number'
            ? displayNumber(value, units, usesLinearUnits(type, name))
            : value}
          onChange={e => updateParameter(name,
            typeof value === 'number'
              ? canonicalNumber(e.target.value === '' ? 0 : Number(e.target.value),
                  units, usesLinearUnits(type, name))
              : e.target.value
          )} /></div>)}</div>
      <p className="hint unit-note">{t.unitNote}</p>
      <div className="actions">
        <button disabled={working} onClick={generate}>{working ? t.working : t.generateSCAD}</button>
        <button disabled={working} onClick={renderSTL}>{working ? t.working : t.generateSTL}</button>
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      </section><section className="panel output">
        <h2>{t.viewer}</h2>
        <STLViewer data={stl} emptyMessage={t.emptyViewer} />
        <p className="hint">{t.help}</p>
        <button className="secondary" disabled={!stl} onClick={downloadSTL}>{t.downloadSTL}</button>
        <h2>{t.code}</h2>
        <pre>{scad || t.empty}</pre>
        <button className="secondary" disabled={!scad} onClick={download}>{t.downloadSCAD}</button>
      </section></div>
    <footer>{t.footer}</footer>
  </main>
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>)
