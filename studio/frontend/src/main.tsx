import React, { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './style.css'
import STLViewer, { type CameraAction, type CameraCommand } from './STLViewer'
import CircularPlatePlan from './CircularPlatePlan'
import { apiFetch } from './api'
import { saveExport, type ExportFormat, normalizeExportName, isDesktop } from './saveFile'
import { fieldForSelectedFace, faceAxisLabel, type FaceSelection } from './selection'
import FeatureOperationsEditor, { type Feature } from './FeatureOperationsEditor'
import { initialLanguage, messages, type Language } from './i18n'
import { canonicalNumber, displayNumber, fieldUnit, usesLinearUnits, type UnitSystem } from './units'

type PartType = 'washer' | 'mounting_plate' | 'open_box' | 'metric_screw' | 'metric_nut' | 'spur_gear' | 'box_lid' | 'bottle_cap' | 'corner_plate' | 'machined_block' | 'feature_model' | 'circular_plate'
type CatalogCategory = 'plates' | 'fasteners' | 'transmission' | 'shafts' | 'supports' | 'enclosures' | 'printing' | 'pipes' | 'machining'
const CATEGORY_ORDER: CatalogCategory[] = ['plates', 'fasteners', 'transmission', 'shafts', 'supports', 'enclosures', 'printing', 'pipes', 'machining']
const CATEGORY_LABELS: Record<CatalogCategory, { es: string; en: string }> = {
  plates: { es: 'Placas y bridas', en: 'Plates and flanges' },
  fasteners: { es: 'Tornillería y fijaciones', en: 'Fasteners' },
  transmission: { es: 'Engranajes y transmisión', en: 'Gears and transmission' },
  shafts: { es: 'Ejes y casquillos', en: 'Shafts and bushings' },
  supports: { es: 'Soportes y perfiles', en: 'Supports and profiles' },
  enclosures: { es: 'Cajas y envolventes', en: 'Boxes and enclosures' },
  printing: { es: 'Impresión 3D', en: '3D printing' },
  pipes: { es: 'Tuberías y conexiones', en: 'Pipes and fittings' },
  machining: { es: 'Mecanizado y operaciones', en: 'Machining and features' }
}
const PART_CATEGORY: Record<string, CatalogCategory> = {
  circular_plate: 'plates', washer: 'fasteners', mounting_plate: 'plates',
  open_box: 'enclosures', metric_screw: 'fasteners', metric_nut: 'fasteners',
  spur_gear: 'transmission', box_lid: 'enclosures', bottle_cap: 'printing',
  corner_plate: 'plates', machined_block: 'machining', feature_model: 'machining'
}
type ParamValue = number | string | Feature[]
type AIProvider = 'ollama' | 'openai' | 'anthropic' | 'gemini'
type Definition = { label: string; params: Record<string, ParamValue> }
const PROMPT_EXAMPLES = {
  es: [
    'Diseña una placa circular maciza de radio exterior 50 mm y espesor 4 mm. Realiza 5 agujeros pasantes de diámetro 3 mm, igualmente espaciados en un círculo de radio 20 mm desde el centro de la placa. La base debe ser un disco, nunca un cuadrado. Usa circular_plate.',    'Diseña una placa de 90 × 55 × 6 mm con esquinas redondeadas de radio 5 mm y dos agujeros de 6 mm separados de los extremos 17 mm. Usa corner_plate.',
    'Diseña un bloque mecanizado de 100 × 60 × 15 mm, dos agujeros pasantes de diámetro 6 mm a 12 mm de ambos extremos y un vaciado central de 48 × 30 mm y 6 mm de profundidad. Usa machined_block.',
    'Crea un feature_model con un bloque base de 100 × 60 × 12 mm: resta un vaciado de 48 × 30 × 6.2 mm en [26,15,6], resta dos cilindros de radio 3 y altura 12.2 en [12,30,-0.1] y [88,30,-0.1], y añade un cilindro de radio 7 y altura 8 en [50,50,11.8]. Incluye todos los campos.'
  ],
  en: [
    'Make a solid circular plate of outer radius 50 mm and thickness 4 mm, with 5 equally spaced through holes of diameter 3 mm on a pitch circle of radius 20 mm. The outer solid is a disk, never a box. Use circular_plate.',    'Design a 90 x 55 x 6 mm corner_plate with rounded corners of radius 5 mm and two 6 mm holes 17 mm from the ends.',
    'Design a machined_block 100 x 60 x 15 mm, two 6 mm through holes 12 mm from both ends and a centered 48 x 30 mm pocket 6 mm deep.',
    'Make a feature_model from a 100 x 60 x 12 mm block: cut a 48 x 30 x 6.2 mm box at [26,15,6], cut two radius 3 height 12.2 cylinders at [12,30,-0.1] and [88,30,-0.1], then add a radius 7 height 8 cylinder at [50,50,11.8]. Include all required fields.'
  ]
} as const

const catalog: Record<PartType, Definition> = {
  circular_plate: { label: 'Circular plate', params: { outer_radius: 50, thickness: 4, hole_count: 5, hole_diameter: 3, bolt_circle_radius: 20 } },
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
  const [catalogCategory, setCatalogCategory] = useState('all')
  const [catalogSearch, setCatalogSearch] = useState('')
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
  const [savePending, setSavePending] = useState<ExportFormat | null>(null)
  const [saveStem, setSaveStem] = useState('')
  const [saveBusy, setSaveBusy] = useState(false)
  const [saveStatus, setSaveStatus] = useState('')
  const [selectedFace, setSelectedFace] = useState<FaceSelection | null>(null)
  const [selectedDimension, setSelectedDimension] = useState<string | null>(null)
  const [showReferencePlanes, setShowReferencePlanes] = useState(true)
  const [showCircularPlan, setShowCircularPlan] = useState(false)
  const [cameraCommand, setCameraCommand] = useState<CameraCommand | undefined>()
  const [expandedInspector, setExpandedInspector] = useState<'size' | 'details' | 'operations' | null>('size')
  const [livePreview, setLivePreview] = useState(true)
  const [previewPhase, setPreviewPhase] = useState<'idle' | 'pending' | 'rendering' | 'ready' | 'error'>('idle')
  const [previewReady, setPreviewReady] = useState(false)
  const [manualRender, setManualRender] = useState(0)
  const lastManualRender = useRef(0)
  const previewSerial = useRef(0)
  const previewAbort = useRef<AbortController | null>(null)

  function moveCamera(action: CameraAction) {
    setCameraCommand(previous => ({ action, sequence: (previous?.sequence ?? 0) + 1 }))
  }
  const primaryFields = new Set([
    'width', 'depth', 'height', 'thickness', 'length',
    'outer_diameter', 'inner_diameter', 'outer_radius', 'diameter', 'box_width', 'box_depth',
    'neck_outer_diameter', 'wall',
  ])

  useEffect(() => {
    apiFetch('/api/catalog').then(r => { if (!r.ok) throw Error('Catalog unavailable'); return r.json() })
      .then(body => {
        if (!body.parts || !body.parts.circular_plate) {
          throw Error('OLD_CAD_CORE')
        }
        setCatalogData(body.parts)
      })
      .catch(reason => {
        setCatalogData(null)
        setError(reason instanceof Error && reason.message === 'OLD_CAD_CORE'
          ? (language === 'es'
            ? 'El servidor CAD es una versión anterior: no admite placas circulares. Cierra el servidor Python y Tauri, actualiza GitHub y vuelve a iniciarlos.'
            : 'CAD backend is outdated and lacks circular plates. Stop Python/Tauri, update the repository, and restart.')
          : (language === 'es'
            ? 'No se puede consultar el catálogo CAD. Comprueba que el servidor está iniciado.'
            : 'CAD catalog is unavailable. Check that the server is running.'))
      })
    apiFetch('/api/providers').then(r => r.json()).then(body => {
      const selected = body.providers?.[0]
      if (selected) {
        setAiModel(selected.model || '')
        setProviderInfo(selected.endpoint || '')
      }
    }).catch(() => {})
    refreshOllamaModels()
  }, [])
  async function refreshOllamaModels() {
    setModelsError('')
    try {
      const response = await apiFetch('/api/ollama/models')
      const body = await response.json()
      if (!response.ok) throw Error(body.error || 'Ollama unavailable')
      const names: string[] = Array.isArray(body.models)
        ? body.models.filter((name: unknown): name is string => typeof name === 'string')
        : []
      setOllamaModels(names)
      if (names.length) setAiModel(old => old && names.includes(old) ? old : names[0])
      else setModelsError(language === 'es'
        ? 'No se han encontrado modelos instalados en el servidor Ollama activo.'
        : 'No installed models were found on the active Ollama server.')
    } catch {
      setModelsError(language === 'es'
        ? 'El servidor CAD u Ollama no responde. Comprueba que se han iniciado y pulsa Actualizar.'
        : 'CAD server or Ollama is unavailable. Start the services and click Refresh.')
    }
  }
  const activeCatalog = catalogData
    ? Object.fromEntries(Object.entries(catalogData).map(([id, desc]) => [
        id, { label: id, params: Object.fromEntries(
          desc.fields.map(field => [field.key, field.default])) }
      ])) as Record<string, Definition>
    : catalog
  const partIds = Object.keys(activeCatalog) as PartType[]
  const catalogCategoryFor = (id: string): string => {
    const backendCategory = (catalogData?.[id] as { category?: unknown } | undefined)?.category
    return typeof backendCategory === 'string' && backendCategory.trim()
      ? backendCategory.trim() : (PART_CATEGORY[id] || 'other')
  }
  const categoryLabel = (category: string): string =>
    category in CATEGORY_LABELS
      ? CATEGORY_LABELS[category as CatalogCategory][language]
      : category === 'other' ? (language === 'es' ? 'Otras piezas' : 'Other parts')
      : category.replace(/[_-]/g, ' ')
  const catalogGroups = [...new Set(partIds.map(catalogCategoryFor))]
    .sort((a, b) => {
      const ai = CATEGORY_ORDER.indexOf(a as CatalogCategory)
      const bi = CATEGORY_ORDER.indexOf(b as CatalogCategory)
      return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi) || a.localeCompare(b)
    })
  const normalizedCatalogSearch = catalogSearch.trim().toLocaleLowerCase(language)
  const filteredCatalogIds = partIds.filter(id => {
    const category = catalogCategoryFor(id)
    const visible = catalogCategory === 'all' || catalogCategory === category
    const label = (t.parts as Record<string, string>)[id] || activeCatalog[id]?.label || id
    return visible && (!normalizedCatalogSearch ||
      [id, label, categoryLabel(category)].some(value => value.toLocaleLowerCase(language).includes(normalizedCatalogSearch)))
  })
  async function interpretPrompt() {
    setWorking(true); setError(''); setAiNote('')
    try {
      const response = await apiFetch('/api/interpret', {
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
      previewSerial.current += 1
      // An AI proposal is not yet an approved/rendered shape. Never leave
      // the previous rectangular mesh underneath a newly proposed disk.
      setStl(null)
      setSelectedFace(null)
      setSelectedDimension(null)
      if (nextType === 'circular_plate') setShowReferencePlanes(false)
      setShowCircularPlan(nextType === 'circular_plate')
      setType(nextType); setParams(next); setScad(''); setPreviewReady(false)
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
  function selectModelFace(face: FaceSelection | null) {
    setSelectedFace(face)
    const field = face ? fieldForSelectedFace(type, face, Object.keys(params)) : null
    setSelectedDimension(field)
    if (field) {
      setExpandedInspector(primaryFields.has(field) ? 'size' : 'details')
      // Inspector may be in a collapsed layout on narrower screens.
      requestAnimationFrame(() => {
        const input = document.getElementById(field)
        if (input) {
          input.scrollIntoView({ behavior: 'smooth', block: 'center' })
          input.focus({ preventScroll: true })
        }
      })
    }
  }
  function updateParameter(name: string, value: ParamValue) {
    setParams(previous => ({ ...previous, [name]: value }))
    setScad('')
    previewSerial.current += 1
    setPreviewReady(false)
    // Once the user approved an AI proposal, subsequent direct edits are
    // intentional user changes and keep live feedback enabled.
    setSelectedFace(null)
  }
  function changeType(next: PartType) {
    setExpandedInspector('size')
    previewSerial.current += 1
    // Changing part family changes topology: the last mesh must be cleared.
    // Keeping it visible made users mistake an old square for their new disk.
    setStl(null)
    if (next === 'circular_plate') setShowReferencePlanes(false)
    setShowCircularPlan(next === 'circular_plate')
    setType(next); setParams({ ...activeCatalog[next].params }); setScad(''); setPreviewReady(false); setError(''); setReviewApproved(false); setAiNote(''); setSelectedFace(null); setSelectedDimension(null)
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
      const response = await apiFetch('/api/scad', {
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
  // Interactive CAD regeneration: inputs are debounced, the previous solid
  // remains visible while a new validated STL is computed. Old responses
  // cannot overwrite newer user edits. Web supports abort; desktop ignores
  // stale responses through the shared generation counter.
  useEffect(() => {
    const requestedManual = manualRender !== lastManualRender.current
    if (requestedManual) lastManualRender.current = manualRender
    const serial = ++previewSerial.current
    previewAbort.current?.abort()
    previewAbort.current = null
    if (!livePreview && !requestedManual) {
      setPreviewPhase('idle')
      return
    }
    if (aiNote && !reviewApproved) {
      setPreviewPhase('idle')
      return
    }
    setPreviewPhase('pending')
    const controller = new AbortController()
    previewAbort.current = controller
    const timer = window.setTimeout(async () => {
      if (controller.signal.aborted || serial !== previewSerial.current) return
      setPreviewPhase('rendering')
      try {
        const response = await apiFetch('/api/stl', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-OrkiCAD-Client': 'studio' },
          body: JSON.stringify({ type, ...params }),
          signal: controller.signal,
        })
        if (!response.ok) {
          const raw = await response.text()
          let detail = raw.slice(0, 400)
          try { detail = (JSON.parse(raw) as { error?: string }).error || detail }
          catch { /* Non-JSON proxy errors are still displayed */ }
          throw new Error(detail || 'STL generation failed: HTTP ' + response.status)
        }
        const typeHeader = response.headers.get('content-type') || ''
        if (!typeHeader.includes('model/stl') && !typeHeader.includes('application/octet-stream')) {
          throw new Error('Unexpected STL response: ' + (typeHeader || 'unknown'))
        }
        const buffer = await response.arrayBuffer()
        if (buffer.byteLength < 84) throw new Error('Empty or incomplete STL model')
        if (serial !== previewSerial.current || controller.signal.aborted) return
        setStl(buffer)
        setPreviewReady(true)
        setPreviewPhase('ready')
        setError('')
      } catch (reason) {
        if (serial !== previewSerial.current || controller.signal.aborted) return
        setPreviewReady(false)
        setPreviewPhase('error')
        setError(reason instanceof Error ? reason.message : String(reason))
      }
    }, requestedManual ? 0 : 650)
    return () => {
      window.clearTimeout(timer)
      controller.abort()
      if (previewAbort.current === controller) previewAbort.current = null
    }
  }, [type, params, aiNote, reviewApproved, livePreview, manualRender])

  function renderSTL() {
    if (aiNote && !reviewApproved) { setError(t.approvalRequired); return }
    setManualRender(count => count + 1)
  }
  function openSave(format: ExportFormat) {
    setSaveStatus('')
    setSaveStem('orkicad_' + type)
    setSavePending(format)
  }

  async function produceExport(format: ExportFormat): Promise<Blob> {
    if (format === 'stl') {
      if (!stl || !previewReady) throw new Error(language === 'es'
        ? 'Primero genera la vista 3D para obtener el STL.'
        : 'Generate the 3D preview before saving an STL.')
      return new Blob([stl], { type: 'model/stl' })
    }
    if (format === 'scad') {
      if (!scad) throw new Error(language === 'es'
        ? 'Primero genera el código OpenSCAD.'
        : 'Generate OpenSCAD source before saving.')
      return new Blob([scad], { type: 'text/plain;charset=utf-8' })
    }
    const response = await apiFetch('/api/' + format, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-OrkiCAD-Client': 'studio' },
      body: JSON.stringify({ type, ...params }),
    })
    if (!response.ok) {
      const raw = await response.text()
      let detail = raw.slice(0, 500)
      try { detail = (JSON.parse(raw) as { error?: string }).error || detail }
      catch { /* Proxy errors might not be JSON */ }
      throw new Error(detail || 'CAD export failed (' + response.status + ')')
    }
    const blob = await response.blob()
    if (!blob.size) throw new Error('Empty CAD export')
    return blob
  }

  async function confirmSave() {
    const format = savePending
    if (!format || saveBusy) return
    try {
      // Validate before opening the operating-system picker.
      normalizeExportName(saveStem, format)
      setSaveBusy(true)
      setError('')
      // This call is triggered by a click, preserving web picker activation.
      const result = await saveExport(format, saveStem, () => produceExport(format))
      setSavePending(null)
      if (result === 'saved') {
        setSaveStatus(language === 'es' ? 'Archivo guardado correctamente.' : 'File saved successfully.')
      } else if (result === 'browser-download') {
        setSaveStatus(language === 'es'
          ? 'Descarga iniciada. La carpeta de destino depende de la configuración de tu navegador.'
          : 'Download started. The save location depends on your browser settings.')
      } else {
        setSaveStatus(language === 'es' ? 'Guardado cancelado.' : 'Save cancelled.')
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason))
    } finally {
      setSaveBusy(false)
    }
  }

  function exportFormat(format: '3mf' | 'step') {
    if (aiNote && !reviewApproved) { setError(t.approvalRequired); return }
    openSave(format)
  }

  function downloadSTL() {
    if (stl && previewReady) openSave('stl')
  }

  function download() {
    if (scad) openSave('scad')
  }

  const ui = language === 'es' ? {
    project: 'Diseño sin título', workspace: 'Espacio de trabajo', assistant: 'Asistente IA',
    settings: 'Configuración de IA', examples: 'Ejemplos de diseño',
    viewport: 'Vista 3D', render: 'Actualizar modelo', empty: 'Tu diseño empieza aquí',
    emptyHelp: 'Describe una pieza o modifica sus dimensiones y genera el modelo 3D.',
    properties: 'Propiedades', library: 'Biblioteca paramétrica', dimensions: 'Geometría y parámetros',
    output: 'Fabricación y exportación', source: 'Código OpenSCAD',
    waiting: 'Sin modelo generado', status: 'Listo para diseñar', intro: 'CAD inteligente · entorno local',
    formats: 'Exportar', inspector: 'Inspector', scene: 'Modelo CAD',
  } : {
    project: 'Untitled design', workspace: 'Workspace', assistant: 'AI assistant',
    settings: 'AI configuration', examples: 'Design examples',
    viewport: '3D viewport', render: 'Update model', empty: 'Your design starts here',
    emptyHelp: 'Describe a part or change its dimensions and render the 3D model.',
    properties: 'Properties', library: 'Parametric library', dimensions: 'Geometry & parameters',
    output: 'Manufacturing & export', source: 'OpenSCAD source',
    waiting: 'No model generated', status: 'Ready to design', intro: 'Intelligent CAD · local workspace',
    formats: 'Export', inspector: 'Inspector', scene: 'CAD model',
  }
  const exportBlocked = working || saveBusy || (!!aiNote && !reviewApproved)
  return <div className="studio-shell">
    <header className="studio-topbar">
      <div className="studio-brand">
        <span className="brand-icon" aria-hidden="true">◈</span>
        <strong>Orki<span>CAD</span></strong><span className="brand-ai">AI</span>
        <span className="brand-studio">STUDIO</span>
      </div>
      <div className="studio-document">
        <span>{ui.workspace}</span><span aria-hidden="true">/</span><strong>{ui.project}</strong>
        <span className="document-dot" aria-hidden="true"></span>
      </div>
      <div className="studio-top-actions">
        <span className="connection-status"><i></i>{working ? t.working : ui.status}</span>
        <select aria-label={t.language} value={language}
          onChange={e => setLanguage(e.target.value as Language)}>
          <option value="es">ES</option><option value="en">EN</option>
        </select>
        <select aria-label={t.units} value={units}
          onChange={e => setUnits(e.target.value as UnitSystem)}>
          <option value="metric">mm</option><option value="imperial">in</option>
        </select>
      </div>
    </header>

    <main className="studio-main">
      <aside className="studio-sidebar assistant-sidebar" aria-label={ui.assistant}>
        <div className="sidebar-header">
          <div className="section-overline">01 / INTELLIGENCE</div>
          <h1><span className="section-icon">✧</span> {ui.assistant}</h1>
          <p>{t.aiDescription}</p>
        </div>
        <div className="sidebar-content">
          <label htmlFor="cad-ai-prompt">{t.aiPromptLabel}</label>
          <textarea id="cad-ai-prompt" className="ai-prompt" rows={8}
            aria-label={t.aiPromptLabel} placeholder={t.aiPlaceholder} value={prompt}
            maxLength={2000} onChange={e => setPrompt(e.target.value)} />
          <div className="text-counter">{prompt.length} / 2000</div>
          <details className="studio-disclosure">
            <summary><span>▧</span> {ui.examples}<span className="disclosure-arrow">⌄</span></summary>
            <div className="prompt-examples">
              {PROMPT_EXAMPLES[language].map((example, index) =>
                <article className="prompt-example" key={index}>
                  <p>{example}</p>
                  <div className="prompt-example-actions">
                    <button type="button" className="secondary" onClick={() => useExample(index)}>{t.useExample}</button>
                    <button type="button" className="secondary" onClick={() => copyExample(index)}>
                      {copiedExample === index ? t.copiedExample : t.copyExample}
                    </button>
                  </div>
                </article>
              )}
            </div>
          </details>
          <div className="sidebar-section-title"><span>◉</span> {ui.settings}</div>
          <label htmlFor="ai-provider">{t.aiProvider}</label>
          <select id="ai-provider" value={aiProvider} onChange={e => {
            const selected = e.target.value as AIProvider
            setAiProvider(selected)
            setAiModel(selected === 'ollama' ? (ollamaModels[0] || '') : '')
            setApiKey('')
            setAiNote('')
            setReviewApproved(false)
          }}>
            <option value="ollama">Ollama · Local</option>
            <option value="openai">OpenAI · API</option>
            <option value="anthropic">Claude · API</option>
            <option value="gemini">Gemini · API</option>
          </select>
          {aiProvider === 'ollama' ? <>
            <label htmlFor="ai-model">{t.aiModel}</label>
            <div className="model-picker">
              <select id="ollama-model-picker" aria-label={t.chooseModel}
                value={ollamaModels.includes(aiModel) ? aiModel : ''}
                onChange={e => setAiModel(e.target.value)}>
                <option value="">{t.chooseModel}</option>
                {ollamaModels.map(model => <option key={model} value={model}>{model}</option>)}
              </select>
              <button type="button" className="secondary" onClick={refreshOllamaModels}
                aria-label={language === 'es' ? 'Actualizar modelos Ollama' : 'Refresh Ollama models'}>
                ↻ {language === 'es' ? 'Actualizar lista' : 'Refresh list'}
              </button>
              <input id="ai-model" type="text" value={aiModel}
                placeholder={t.modelIdPlaceholder} aria-label={t.manualModel}
                onChange={e => setAiModel(e.target.value)} />
            </div>
            {modelsError && <p className="muted-note">{t.modelListUnavailable}: {modelsError}</p>}
            <p className="muted-note">{t.aiLocalOnly}: {providerInfo || 'http://127.0.0.1:11434'}</p>
          </> : <>
            <label htmlFor="ai-model">{t.cloudModel}</label>
            <input id="ai-model" type="text" value={aiModel}
              placeholder={t.cloudModelPlaceholder} onChange={e => setAiModel(e.target.value)} />
            <label htmlFor="ai-api-key">{t.apiKey}</label>
            <input id="ai-api-key" type="password" value={apiKey}
              autoComplete="off" spellCheck={false}
              placeholder={t.apiKeyPlaceholder} onChange={e => setApiKey(e.target.value)} />
            <p className="muted-note">{t.cloudSecurityNotice}</p>
          </>}
          <button className="action-primary propose-button"
            disabled={working || prompt.trim().length < 3 || !aiModel.trim() || (aiProvider !== 'ollama' && apiKey.trim().length < 8)}
            onClick={interpretPrompt}><span aria-hidden="true">✧</span> {working ? t.working : t.aiInterpret}</button>
          {aiNote && <p className="ai-review" role="status">{aiNote}</p>}
          {error && <p className="error" role="alert">{error}</p>}
        </div>
        <div className="sidebar-footer">{ui.intro}</div>
      </aside>

      <section className="studio-center" aria-label={ui.viewport}>
        <div className="viewport-heading">
          <div><div className="section-overline">02 / MODEL</div><h2>{ui.viewport}</h2></div>
          <div className="viewport-badges">
            {type === 'circular_plate' && <button type="button"
              className="secondary circular-plan-toggle" aria-pressed={showCircularPlan}
              onClick={() => setShowCircularPlan(old => !old)}>
              {language === 'es' ? '⊙ Planta acotada' : '⊙ Dimensioned top view'}
            </button>}
            <label className="reference-toggle live-preview-toggle">
              <input type="checkbox" checked={livePreview}
                onChange={event => setLivePreview(event.target.checked)} />
              {language === 'es' ? 'Vista dinámica' : 'Live preview'}
            </label>
            <span>◈ 3D</span><span>{units === 'metric' ? 'mm' : 'in'}</span>
            <label className="reference-toggle">
              <input type="checkbox" checked={showReferencePlanes}
                onChange={event => setShowReferencePlanes(event.target.checked)} />
              {language === 'es' ? 'Planos 0,0,0' : 'Datum planes 0,0,0'}
            </label>
          </div>
        </div>
        <div className="viewport-frame">
          {(previewPhase === 'pending' || previewPhase === 'rendering') &&
            <div className="preview-computing" role="status">
              <span className="preview-pulse" aria-hidden="true"></span>
              {language === 'es'
                ? previewPhase === 'pending' ? 'Preparando cambios…' : 'Actualizando geometría…'
                : previewPhase === 'pending' ? 'Preparing changes…' : 'Updating geometry…'}
            </div>}
          {stl && !previewReady && (previewPhase === 'error' || previewPhase === 'idle') &&
            <div className="preview-stale" role="status">
              {language === 'es'
                ? previewPhase === 'error' ? 'Última vista válida · revisa las medidas' : 'Vista anterior · pulsa Actualizar'
                : previewPhase === 'error' ? 'Last valid view · check dimensions' : 'Previous view · click Update'}
            </div>}
          <div className="viewport-grid" aria-hidden="true"></div>
          {type === 'circular_plate' && showCircularPlan && <div className="circular-plan-overlay">
            <CircularPlatePlan outerRadius={Number(params.outer_radius)}
              pitchRadius={Number(params.bolt_circle_radius)}
              holeCount={Number(params.hole_count)}
              holeDiameter={Number(params.hole_diameter)}
              language={language} />
          </div>}
          <div className="cad-camera-toolbar" role="toolbar" aria-label={language === 'es' ? 'Navegación de la cámara CAD' : 'CAD camera navigation'}>
            <div className="camera-toolbar-group">
              <button title={language === 'es' ? 'Ajustar toda la pieza' : 'Fit model'} aria-label={language === 'es' ? 'Ajustar pieza' : 'Fit model'} disabled={!stl} onClick={() => moveCamera('fit')}>⛶</button>
              <button title={language === 'es' ? 'Centrar sin cambiar orientación' : 'Center without changing view'} aria-label={language === 'es' ? 'Centrar' : 'Center'} disabled={!stl} onClick={() => moveCamera('center')}>⌖</button>
              <button title={language === 'es' ? 'Vista isométrica' : 'Isometric view'} disabled={!stl} onClick={() => moveCamera('iso')}>ISO</button>
            </div>
            <div className="camera-toolbar-group">
              <button title={language === 'es' ? 'Vista superior (XY)' : 'Top view (XY)'} disabled={!stl} onClick={() => moveCamera('top')}>XY</button>
              <button title={language === 'es' ? 'Vista frontal (XZ)' : 'Front view (XZ)'} disabled={!stl} onClick={() => moveCamera('front')}>XZ</button>
              <button title={language === 'es' ? 'Vista lateral derecha (YZ)' : 'Right view (YZ)'} disabled={!stl} onClick={() => moveCamera('right')}>YZ</button>
            </div>
            <div className="camera-toolbar-group">
              <button title={language === 'es' ? 'Girar 15° a la izquierda' : 'Rotate 15° left'} disabled={!stl} onClick={() => moveCamera('rotate-left')}>↶</button>
              <button title={language === 'es' ? 'Girar 15° a la derecha' : 'Rotate 15° right'} disabled={!stl} onClick={() => moveCamera('rotate-right')}>↷</button>
              <button title={language === 'es' ? 'Acercar' : 'Zoom in'} disabled={!stl} onClick={() => moveCamera('zoom-in')}>＋</button>
              <button title={language === 'es' ? 'Alejar' : 'Zoom out'} disabled={!stl} onClick={() => moveCamera('zoom-out')}>−</button>
            </div>
          </div>
          <STLViewer data={stl} emptyMessage={ui.emptyHelp} onFaceSelect={selectModelFace} showReferencePlanes={showReferencePlanes} cameraCommand={cameraCommand} />
          {!stl && <div className="viewport-empty" aria-hidden="true">
            <div className="viewport-empty-icon">⬡</div>
            <strong>{ui.empty}</strong><p>{ui.emptyHelp}</p>
          </div>}
          <div className="viewport-axis" aria-hidden="true"><span>Z</span><span>Y</span><span>X</span></div>
          <div className="datum-legend" aria-label={language === 'es' ? 'Planos de referencia' : 'Datum planes'}>
            <span><i className="datum-swatch datum-xy"></i>XY · Z=0</span>
            <span><i className="datum-swatch datum-xz"></i>XZ · Y=0</span>
            <span><i className="datum-swatch datum-yz"></i>YZ · X=0</span>
            <strong>⊙ (0,0,0)</strong>
          </div>
          <span className="viewport-caption">{stl
            ? (language === 'es' ? 'Clic: seleccionar cara · Arrastrar: girar · Rueda: zoom' : 'Click: select face · Drag: orbit · Scroll: zoom')
            : ui.waiting}</span>
        </div>
        <div className="viewport-foot">
          <div className="current-part">
            <span className="part-icon">⬡</span><div><strong>{t.parts[type]}</strong><small>{ui.scene}</small></div>
          </div>
          {selectedDimension && typeof params[selectedDimension] === 'number' &&
            <div className="face-quick-adjust">
              <label htmlFor="selected-dimension-range">
                {language === 'es' ? 'Ajuste rápido' : 'Quick adjust'} ·
                {' '}{t.fields[selectedDimension as keyof typeof t.fields] ?? selectedDimension}
              </label>
              <div className="face-quick-row">
                <input id="selected-dimension-range" type="range"
                  aria-label={language === 'es' ? 'Modificar medida en tiempo real' : 'Adjust dimension live'}
                  min={displayNumber(0.1, units, usesLinearUnits(type, selectedDimension))}
                  max={displayNumber(Math.max(50, Math.ceil((params[selectedDimension] as number) * 2 / 10) * 10),
                    units, usesLinearUnits(type, selectedDimension))}
                  step={units === 'imperial' && usesLinearUnits(type, selectedDimension) ? '0.02' : '0.5'}
                  value={displayNumber(params[selectedDimension] as number, units, usesLinearUnits(type, selectedDimension))}
                  onChange={event => updateParameter(selectedDimension,
                    canonicalNumber(Number(event.target.value), units, usesLinearUnits(type, selectedDimension)))} />
                <strong>{displayNumber(params[selectedDimension] as number, units, usesLinearUnits(type, selectedDimension))}
                  <small>{fieldUnit(type, selectedDimension, units)}</small></strong>
              </div>
            </div>}
          {selectedFace && <div className="face-selection-info" role="status">
            <strong>◈ {faceAxisLabel(selectedFace, language)}</strong>
            <span>{selectedDimension
              ? (language === 'es'
                ? 'Parámetro asociado: ' : 'Related parameter: ') +
                (t.fields[selectedDimension as keyof typeof t.fields] ?? selectedDimension)
              : (language === 'es'
                ? 'Selección de superficie; todavía sin parámetro vinculado.'
                : 'Surface selected; no mapped parameter yet.')}</span>
          </div>}
          <div className="viewport-action-row">
            <button className="action-primary" disabled={exportBlocked} onClick={renderSTL}>◈ {ui.render}</button>
            <button className="secondary" disabled={!stl || !previewReady} onClick={downloadSTL}>↓ STL</button>
          </div>
        </div>
        <div className="output-bar">
          <div><div className="section-overline">03 / OUTPUT</div><h3>{ui.output}</h3></div>
          <div className="output-actions">
            <button disabled={exportBlocked} onClick={generate}>SCAD</button>
            <button disabled={exportBlocked} onClick={() => exportFormat('3mf')}>3MF</button>
            <button disabled={exportBlocked} onClick={() => exportFormat('step')}>STEP</button>
          </div>
        </div>
        <details className="source-panel">
          <summary>⌘ {ui.source}<span className="disclosure-arrow">⌄</span></summary>
          <pre>{scad || t.empty}</pre>
          <button className="secondary" disabled={!scad} onClick={download}>{t.downloadSCAD}</button>
        </details>
      </section>

      <aside className="studio-sidebar properties-sidebar" aria-label={ui.properties}>
        <div className="sidebar-header">
          <div className="section-overline">04 / INSPECTOR</div>
          <h2><span className="section-icon">☷</span> {ui.properties}</h2>
          <p>{ui.library}</p>
        </div>
        <div className="sidebar-content">
          <div className="inspector-compact-header parametric-catalog">
            <span>{language === 'es' ? 'Catálogo paramétrico' : 'Parametric catalog'}</span>
            <label htmlFor="catalog-search">{language === 'es' ? 'Buscar piezas o categorías' : 'Search parts or categories'}</label>
            <input id="catalog-search" type="search" value={catalogSearch}
              placeholder={language === 'es' ? 'Buscar por nombre…' : 'Search by name…'}
              onChange={e => setCatalogSearch(e.target.value)} />
            <label htmlFor="catalog-category">{language === 'es' ? 'Categoría' : 'Category'}</label>
            <select id="catalog-category" value={catalogCategory}
              onChange={e => setCatalogCategory(e.target.value)}>
              <option value="all">{language === 'es' ? 'Todas las categorías' : 'All categories'}</option>
              {catalogGroups.map(category =>
                <option key={category} value={category}>{categoryLabel(category)} ({partIds.filter(id => catalogCategoryFor(id) === category).length})</option>)}
            </select>
            <label htmlFor="type">{t.partType}</label>
            <select id="type" aria-label={t.partType} value={filteredCatalogIds.includes(type) ? type : ''}
              onChange={e => { if (e.target.value) changeType(e.target.value as PartType) }}>
              {!filteredCatalogIds.includes(type) && <option value="">{language === 'es' ? 'Selecciona una pieza' : 'Select a part'}</option>}
              {catalogGroups.map(category => {
                const items = filteredCatalogIds.filter(id => catalogCategoryFor(id) === category)
                return items.length ? <optgroup key={category} label={categoryLabel(category)}>
                  {items.map(id => <option key={id} value={id}>{(t.parts as Record<string, string>)[id] || activeCatalog[id]?.label || id}</option>)}
                </optgroup> : null
              })}
            </select>
            <small className="catalog-result-count">{filteredCatalogIds.length} / {partIds.length} {language === 'es' ? 'piezas disponibles' : 'available parts'}</small>
            {filteredCatalogIds.length === 0 && <small className="catalog-no-results">
              {language === 'es' ? 'No hay piezas que coincidan con la búsqueda.' : 'No matching parts found.'}
            </small>}
          </div>
          {aiNote && <label className="review-checkbox"><input type="checkbox"
            checked={reviewApproved} onChange={e => setReviewApproved(e.target.checked)} />
            {t.approveForExport}
          </label>}
          {(['size', 'details', 'operations'] as const).map(group => {
            const fields = Object.entries(params).filter(([key]) =>
              group === 'operations' ? key === 'operations'
                : group === 'size' ? key !== 'operations' && primaryFields.has(key)
                : key !== 'operations' && !primaryFields.has(key))
            if (!fields.length) return null
            const heading = group === 'size'
              ? (language === 'es' ? 'Medidas principales' : 'Main dimensions')
              : group === 'details'
                ? (language === 'es' ? 'Detalles y mecanizados' : 'Details and machining')
                : (language === 'es' ? 'Historial de operaciones' : 'Operation history')
            return <section key={group} className="inspector-section">
              <button type="button" className="inspector-section-toggle"
                aria-expanded={expandedInspector === group}
                onClick={() => setExpandedInspector(current => current === group ? null : group)}>
                <span>{group === 'size' ? '▣' : group === 'details' ? '⚙' : '◈'} {heading}</span>
                <span className="inspector-section-count">{group === 'operations'
                  ? (Array.isArray(params.operations) ? params.operations.length : 0)
                  : fields.length}</span>
                <span aria-hidden="true">{expandedInspector === group ? '⌃' : '⌄'}</span>
              </button>
              {expandedInspector === group && <div className="inspector-section-body">
                <div className="fields">{fields.map(([name, value]) =>
                  <div key={name} className={selectedDimension === name ? 'param-focused' : undefined}>
                    <label htmlFor={name}>{t.fields[name as keyof typeof t.fields] ?? name.replace(/_/g, ' ')}
                      {fieldUnit(type, name, units) ? ' (' + fieldUnit(type, name, units) + ')' : ''}
                    </label>
                    {name === 'operations' && Array.isArray(value)
                      ? <FeatureOperationsEditor operations={value as Feature[]} language={language}
                          width={Number(params.width) || 100} depth={Number(params.depth) || 60}
                          height={Number(params.height) || 12}
                          onChange={next => updateParameter(name, next)} />
                      : catalogData?.[type]?.fields.find(field => field.key === name)?.options
                        ? <select id={name} value={String(value)} onChange={e => updateParameter(name, e.target.value)}>
                            {catalogData[type].fields.find(field => field.key === name)!.options!.map(option =>
                              <option key={option} value={option}>{option}</option>)}
                          </select>
                        : <input id={name} type={typeof value === 'number' ? 'number' : 'text'}
                            step={name === 'teeth' || name === 'hole_count' || name === 'diameter' ? '1' : 'any'}
                            value={typeof value === 'number'
                              ? displayNumber(value, units, usesLinearUnits(type, name))
                              : String(value)}
                            onChange={e => updateParameter(name,
                              typeof value === 'number'
                                ? canonicalNumber(e.target.value === '' ? 0 : Number(e.target.value),
                                  units, usesLinearUnits(type, name))
                                : e.target.value)} />}
                  </div>
                )}</div>
              </div>}
            </section>
          })}
          <details className="inspector-reference-help">
            <summary>⊙ {language === 'es' ? 'Origen y sistema de coordenadas' : 'Origin and coordinates'}</summary>
            <p>{language === 'es'
              ? 'El origen absoluto es (0,0,0). Los planos XY, XZ e YZ son referencias fijas; girar el visor no cambia las coordenadas.'
              : 'The absolute origin is (0,0,0). XY, XZ and YZ datum planes remain fixed while orbiting.'}</p>
          </details>
          <p className="muted-note">{t.unitNote}</p>
        </div>
      </aside>
    </main>
    {savePending && <div className="save-overlay">
      <section className="save-dialog" role="dialog" aria-modal="true" aria-labelledby="save-dialog-title">
        <div className="section-overline">ORKICAD STUDIO / EXPORT</div>
        <h2 id="save-dialog-title">{language === 'es' ? 'Guardar modelo CAD' : 'Save CAD model'}</h2>
        <p>{language === 'es'
          ? 'Revisa el nombre del archivo y elige la carpeta de destino antes de guardar.'
          : 'Review the filename and choose the destination folder before saving.'}</p>
        <label htmlFor="save-filename">{language === 'es' ? 'Nombre del archivo' : 'Filename'}</label>
        <div className="save-filename-row">
          <input id="save-filename" autoFocus maxLength={110} value={saveStem}
            onChange={event => setSaveStem(event.target.value)}
            onKeyDown={event => { if (event.key === 'Enter') confirmSave() }} />
          <span>.{savePending}</span>
        </div>
        <p className="muted-note">{isDesktop()
          ? (language === 'es'
            ? 'Se abrirá el diálogo nativo para elegir nombre y ubicación.'
            : 'A native Save As dialog will let you choose the name and location.')
          : (language === 'es'
            ? 'En navegadores compatibles podrás elegir la carpeta. En otros, se usará la configuración de descargas del navegador.'
            : 'Supported browsers let you choose a folder. Others use your browser download settings.')}</p>
        {error && <p className="error" role="alert">{error}</p>}
        <div className="save-dialog-actions">
          <button type="button" className="secondary" disabled={saveBusy}
            onClick={() => setSavePending(null)}>{language === 'es' ? 'Cancelar' : 'Cancel'}</button>
          <button type="button" className="action-primary" disabled={saveBusy || !saveStem.trim()}
            onClick={confirmSave}>{saveBusy
              ? t.working
              : language === 'es' ? 'Elegir ubicación y guardar' : 'Choose location and save'}</button>
        </div>
      </section>
    </div>}
    <footer className="studio-statusbar">
      <span><span className="status-indicator"></span> {ui.status}</span>
      <span role="status">{saveStatus || 'OrkiCAD Core · STL / 3MF / STEP'}</span>
      <span>{units === 'metric' ? 'Metric · mm' : 'Imperial · in'}</span>
    </footer>
  </div>
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>)
