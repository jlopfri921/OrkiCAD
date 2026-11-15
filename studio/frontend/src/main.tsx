import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './style.css'
import STLViewer from './STLViewer'
import FeatureOperationsEditor, { type Feature } from './FeatureOperationsEditor'
import { initialLanguage, messages, type Language } from './i18n'
import { canonicalNumber, displayNumber, fieldUnit, usesLinearUnits, type UnitSystem } from './units'

type PartType = 'washer' | 'mounting_plate' | 'open_box' | 'metric_screw' | 'metric_nut' | 'spur_gear' | 'box_lid' | 'bottle_cap' | 'corner_plate' | 'machined_block' | 'feature_model'
type ParamValue = number | string | Feature[]
type AIProvider = 'ollama' | 'openai' | 'anthropic' | 'gemini'
type Definition = { label: string; params: Record<string, ParamValue> }
const PROMPT_EXAMPLES = {
  es: [
    'Diseña una placa de 90 × 55 × 6 mm con esquinas redondeadas de radio 5 mm y dos agujeros de 6 mm separados de los extremos 17 mm. Usa corner_plate.',
    'Diseña un bloque mecanizado de 100 × 60 × 15 mm, dos agujeros pasantes de diámetro 6 mm a 12 mm de ambos extremos y un vaciado central de 48 × 30 mm y 6 mm de profundidad. Usa machined_block.',
    'Crea un feature_model con un bloque base de 100 × 60 × 12 mm: resta un vaciado de 48 × 30 × 6.2 mm en [26,15,6], resta dos cilindros de radio 3 y altura 12.2 en [12,30,-0.1] y [88,30,-0.1], y añade un cilindro de radio 7 y altura 8 en [50,50,11.8]. Incluye todos los campos.'
  ],
  en: [
    'Design a 90 x 55 x 6 mm corner_plate with rounded corners of radius 5 mm and two 6 mm holes 17 mm from the ends.',
    'Design a machined_block 100 x 60 x 15 mm, two 6 mm through holes 12 mm from both ends and a centered 48 x 30 mm pocket 6 mm deep.',
    'Make a feature_model from a 100 x 60 x 12 mm block: cut a 48 x 30 x 6.2 mm box at [26,15,6], cut two radius 3 height 12.2 cylinders at [12,30,-0.1] and [88,30,-0.1], then add a radius 7 height 8 cylinder at [50,50,11.8]. Include all required fields.'
  ]
} as const

const catalog: Record<PartType, Definition> = {
  washer: { label: 'Washer', params: { outer_diameter: 18, inner_diameter: 6.5, thickness: 2 } },
  mounting_plate: { label: 'Mounting plate', params: { width: 80, depth: 50, thickness: 5, hole_diameter: 5, hole_inset: 10 } },
  open_box: { label: 'Open box', params: { width: 60, depth: 40, height: 25, wall: 2 } },
  metric_screw: { label: 'Metric screw', params: { diameter: 6, pitch: 1, length: 30, head: 'socket', drive: 'hex' } },
  metric_nut: { label: 'Metric nut', params: { diameter: 6, pitch: 1, shape: 'hex', thickness: 'normal' } },
  spur_gear: { label: 'Spur gear', params: { module: 2, teeth: 24, thickness: 8, shaft_diameter: 8, pressure_angle: 20 } },
  box_lid: { label: 'Box lid', params: { box_width: 60, box_depth: 40, box_wall: 2, thickness: 3, overhang: 2, plug_depth: 5, clearance: 0.3 } },
  bottle_cap: { label: 'Bottle cap', params: { neck_outer_diameter: 28, height: 16, wall: 3, top_thickness: 3, pitch: 3, clearance: 0.4, thread_depth: 1 } },
  corner_plate: { label: 'Corner plate', params: { width: 90, depth: 55, thickness: 6, corner_style: 'round', corner_size: 5, hole_diameter: 6, hole_inset: 17 } },
  machined_block: { label: 'Machined block', params: { width: 100, depth: 60, height: 15, hole_diameter: 6, hole_inset: 12, pocket_width: 48, pocket_depth: 30, pocket_cut_depth: 6 } },
  feature_model: { label: 'Feature model', params: { width: 100, depth: 60, height: 12, operations: [{ op: 'cut', shape: 'box', position: [26,15,6], size: [48,30,6.2] },{ op: 'cut', shape: 'cylinder', position: [12,30,-.1], radius: 3, height: 12.2 },{ op: 'cut', shape: 'cylinder', position: [88,30,-.1], radius: 3, height: 12.2 },{ op: 'add', shape: 'cylinder', position: [50,50,11.8], radius: 7, height: 8 }] } }
}

function App() {
  const [language, setLanguage] = useState<Language>(initialLanguage)
  const [units, setUnits] = useState<UnitSystem>('metric')
  const t = messages[language]
  const [type, setType] = useState<PartType>('washer')
  const [catalogData, setCatalogData] = useState<Record<string, { fields: { key: string; default: ParamValue; options?: string[] }[] }> | null>(null)
  const [prompt, setPrompt] = useState('')
  const [aiModel, setAiModel] = useState('')
  const [aiProvider, setAiProvider] = useState<AIProvider>('ollama')
  const [apiKey, setApiKey] = useState('')
  const [ollamaModels, setOllamaModels] = useState<string[]>([])
  const [modelsError, setModelsError] = useState('')
  const [aiNote, setAiNote] = useState('')
  const [providerInfo, setProviderInfo] = useState('')
  const [params, setParams] = useState<Record<string, ParamValue>>(catalog.washer.params)
  const [scad, setScad] = useState('')
  const [stl, setStl] = useState<ArrayBuffer | null>(null)
  const [error, setError] = useState('')
  const [working, setWorking] = useState(false)
  const [reviewApproved, setReviewApproved] = useState(false)
  const [copiedExample, setCopiedExample] = useState<number | null>(null)
  useEffect(() => {
    fetch('/api/catalog').then(r => { if (!r.ok) throw Error('Catalog unavailable'); return r.json() })
      .then(body => setCatalogData(body.parts))
      .catch(() => setCatalogData(null))
    fetch('/api/providers').then(r => r.json()).then(body => {
      const selected = body.providers?.[0]
      if (selected) {
        setAiModel(selected.model || '')
        setProviderInfo(selected.endpoint || '')
      }
    }).catch(() => {})
    fetch('/api/ollama/models').then(async response => {
      const body = await response.json()
      if (!response.ok) throw Error(body.error || 'Ollama unavailable')
      setOllamaModels(Array.isArray(body.models) ? body.models.filter((x: unknown) => typeof x === 'string') : [])
    }).catch(err => setModelsError(String(err)))
  }, [])
  const activeCatalog = catalogData
    ? Object.fromEntries(Object.entries(catalogData).map(([id, desc]) => [
        id, { label: id, params: Object.fromEntries(
          desc.fields.map(field => [field.key, field.default])) }
      ])) as Record<string, Definition>
    : catalog
  const partIds = Object.keys(activeCatalog) as PartType[]
  async function interpretPrompt() {
    setWorking(true); setError(''); setAiNote('')
    try {
      const response = await fetch('/api/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-OrkiCAD-Client': 'studio' },
        body: JSON.stringify({ prompt, model: aiModel || undefined, provider: aiProvider, ...(aiProvider === 'ollama' ? {} : { api_key: apiKey }) })
      })
      const raw = await response.text()
      let result: { error?: string; spec?: Record<string, ParamValue>; review_required?: boolean }
      try { result = JSON.parse(raw) } catch {
        throw new Error(`${t.badJSON} (HTTP ${response.status})`)
      }
      if (!response.ok) throw new Error(result.error || `HTTP ${response.status}`)
      const proposal = result.spec
      if (!proposal || typeof proposal.type !== 'string' || !Object.prototype.hasOwnProperty.call(activeCatalog, proposal.type)) {
        throw new Error('AI returned an unsupported part type')
      }
      const nextType = proposal.type as PartType
      const template = activeCatalog[nextType].params
      const next = Object.fromEntries(Object.keys(template).map(key => [key, proposal[key] ?? template[key]]))
      setType(nextType); setParams(next); setScad(''); setStl(null)
      setReviewApproved(false)
      setAiNote(t.reviewDimensions)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      // Keep credentials in component memory only; never put keys into CAD files,
      // browser storage, URL parameters, export names, or log messages.
      setApiKey('')
      setWorking(false)
    }
  }
  function updateParameter(name: string, value: ParamValue) {
    setParams(previous => ({ ...previous, [name]: value }))
    setScad('')
    setStl(null)
    setReviewApproved(false)
  }
  function changeType(next: PartType) {
    setType(next); setParams({ ...activeCatalog[next].params }); setScad(''); setStl(null); setError(''); setReviewApproved(false)
  }
  function useExample(index: number) {
    setPrompt(PROMPT_EXAMPLES[language][index]); setAiNote(""); setError(""); setCopiedExample(null)
  }
  async function copyExample(index: number) {
    try {
      await navigator.clipboard.writeText(PROMPT_EXAMPLES[language][index])
      setCopiedExample(index)
      setError("")
    } catch {
      // Browser clipboard permissions are optional; the "Use" button remains available.
      setPrompt(PROMPT_EXAMPLES[language][index]); setCopiedExample(null)
      setError(t.clipboardFallback)
    }
  }
  async function generate() {
    if (aiNote && !reviewApproved) { setError(t.approvalRequired); return }
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
    if (aiNote && !reviewApproved) { setError(t.approvalRequired); return }
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
  async function exportFormat(format: "3mf" | "step") {
    if (aiNote && !reviewApproved) { setError(t.approvalRequired); return }
    setWorking(true); setError("")
    try {
      const response = await fetch("/api/" + format, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-OrkiCAD-Client": "studio" },
        body: JSON.stringify({ type, ...params }),
      })
      if (!response.ok) {
        const raw = await response.text()
        try { throw new Error((JSON.parse(raw) as { error?: string }).error || raw.slice(0, 500)) }
        catch (error) { if (error instanceof SyntaxError) throw new Error(raw.slice(0, 500)); throw error }
      }
      const blob = await response.blob()
      if (!blob.size) throw new Error("Empty CAD export")
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = "orkicad_" + type + "." + format
      link.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error))
    } finally { setWorking(false) }
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
      <h2>{t.aiTitle}</h2>
      <p className="hint">{t.aiDescription}</p>
      <label htmlFor="cad-ai-prompt">{t.aiPromptLabel}</label>
      <textarea id="cad-ai-prompt" className="ai-prompt" aria-label={t.aiPromptLabel}
        rows={7} placeholder={t.aiPlaceholder} value={prompt} maxLength={2000}
        onChange={e => setPrompt(e.target.value)} />
      <p className="hint">{t.promptTip} · {prompt.length}/2000</p>
      <div className="prompt-examples">
        <h3>{t.examplesTitle}</h3>
        {PROMPT_EXAMPLES[language].map((example, index) =>
          <div key={index} className="prompt-example">
            <p>{example}</p>
            <div className="prompt-example-actions">
              <button type="button" className="secondary" onClick={() => useExample(index)}>
                {t.useExample}
              </button>
              <button type="button" className="secondary" onClick={() => copyExample(index)}>
                {copiedExample === index ? t.copiedExample : t.copyExample}
              </button>
            </div>
          </div>
        )}
      </div>
      <label htmlFor="ai-provider">{t.aiProvider}</label>
      <select id="ai-provider" value={aiProvider}
        onChange={e => {
          const selected = e.target.value as AIProvider
          setAiProvider(selected)
          setAiModel(selected === 'ollama' ? (ollamaModels[0] || '') : '')
          setApiKey('')
          setAiNote('')
          setReviewApproved(false)
        }}>
        <option value="ollama">Ollama ({t.localProvider})</option>
        <option value="openai">OpenAI (API)</option>
        <option value="anthropic">Claude / Anthropic (API)</option>
        <option value="gemini">Google Gemini (API)</option>
      </select>
      {aiProvider === 'ollama' ? <>
        <label htmlFor="ai-model">{t.aiModel}</label>
        <div className="model-picker">
          <select id="ollama-model-picker" aria-label={t.chooseModel} value={ollamaModels.includes(aiModel) ? aiModel : ''}
            onChange={e => setAiModel(e.target.value)}>
            <option value="">{t.chooseModel}</option>
            {ollamaModels.map(model => <option key={model} value={model}>{model}</option>)}
          </select>
          <input id="ai-model" type="text" value={aiModel}
            placeholder={t.modelIdPlaceholder} aria-label={t.manualModel}
            onChange={e => setAiModel(e.target.value)} />
        </div>
        {modelsError && <p className="hint">{t.modelListUnavailable}: {modelsError}</p>}
      </> : <>
        <label htmlFor="ai-model">{t.cloudModel}</label>
        <input id="ai-model" type="text" value={aiModel}
          placeholder={t.cloudModelPlaceholder} onChange={e => setAiModel(e.target.value)} />
        <label htmlFor="ai-api-key">{t.apiKey}</label>
        <input id="ai-api-key" type="password" value={apiKey}
          autoComplete="off" spellCheck={false}
          placeholder={t.apiKeyPlaceholder} onChange={e => setApiKey(e.target.value)} />
        <p className="hint">{t.cloudSecurityNotice}</p>
      </>}
      {aiProvider === 'ollama' && <p className="hint">{t.aiLocalOnly}: {providerInfo || 'http://127.0.0.1:11434'}</p>}
      <button disabled={working || prompt.trim().length < 3 || !aiModel.trim() || (aiProvider !== 'ollama' && apiKey.trim().length < 8)} onClick={interpretPrompt}>
        {working ? t.working : t.aiInterpret}
      </button>
      {aiNote && <p className="ai-review" role="status">{aiNote}</p>}
      <h2>{t.component}</h2>
      <label htmlFor="type">{t.partType}</label>
      <select id="type" value={type} onChange={e => changeType(e.target.value as PartType)}>
        {partIds.map(id =>
          <option key={id} value={id}>{t.parts[id]}</option>)}
      </select>
      <h2>{t.dimensions}</h2>
      {aiNote && <label className="review-checkbox"><input type="checkbox" checked={reviewApproved}
        onChange={e => setReviewApproved(e.target.checked)} />{t.approveForExport}</label>}
      <div className="fields">{Object.entries(params).map(([name, value]) =>
        <div key={name}><label htmlFor={name}>
          {t.fields[name as keyof typeof t.fields] ?? name.replace(/_/g, ' ')}
          {fieldUnit(type, name, units) ? ` (${fieldUnit(type, name, units)})` : ''}
        </label>{name === 'operations' && Array.isArray(value)
          ? <FeatureOperationsEditor operations={value as Feature[]} language={language}
              width={Number(params.width) || 100} depth={Number(params.depth) || 60}
              height={Number(params.height) || 12}
              onChange={next => updateParameter(name, next)} />
          : catalogData?.[type]?.fields.find(field => field.key === name)?.options
          ? <select id={name} value={String(value)}
              onChange={e => updateParameter(name, e.target.value)}>
              {catalogData[type].fields.find(field => field.key === name)!.options!.map(option =>
                <option key={option} value={option}>{option}</option>)}
            </select>
          : <input id={name}
          type={typeof value === 'number' ? 'number' : 'text'}
          step={name === 'teeth' || name === 'diameter' ? '1' : 'any'}
          value={typeof value === 'number'
            ? displayNumber(value, units, usesLinearUnits(type, name))
            : String(value)}
          onChange={e => updateParameter(name,
            typeof value === 'number'
              ? canonicalNumber(e.target.value === '' ? 0 : Number(e.target.value),
                  units, usesLinearUnits(type, name))
              : e.target.value
          )} />}</div>)}</div>
      <p className="hint unit-note">{t.unitNote}</p>
      <div className="actions">
        <button disabled={working || (!!aiNote && !reviewApproved)} onClick={generate}>{working ? t.working : t.generateSCAD}</button>
        <button disabled={working || (!!aiNote && !reviewApproved)} onClick={renderSTL}>{working ? t.working : t.generateSTL}</button>
        <button disabled={working || (!!aiNote && !reviewApproved)} onClick={() => exportFormat("3mf")}>{t.export3MF}</button>
        <button disabled={working || (!!aiNote && !reviewApproved)} onClick={() => exportFormat("step")}>{t.exportSTEP}</button>
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
