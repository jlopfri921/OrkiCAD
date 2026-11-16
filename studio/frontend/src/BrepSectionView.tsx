/** First non-fabricated OCCT B-rep section in OrkiCAD AI Studio.
 *
 * Only an explicitly supported circular plate is routed here. The dedicated
 * Python OCCT worker returns true intersection edges in global XZ coordinates.
 * This is a line-only section (hatching/sheet standards are later milestones).
 */
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { apiFetch } from './api'
import type { Language } from './i18n'

type Point = [number, number]
type SectionResponse = {
  source: 'occt-brep'
  units: 'mm'
  plane: { name: 'XZ'; origin_mm: [0, 0, 0]; normal: [0, 1, 0] }
  segments: [Point, Point][]
}
type SectionState = { result: SectionResponse | null; error: string; pending: boolean }

function parseSection(value: unknown): SectionResponse {
  if (!value || typeof value !== 'object') throw new Error('Invalid OCCT section response')
  const response = value as Record<string, unknown>
  const plane = response.plane as Record<string, unknown> | undefined
  if (response.source !== 'occt-brep' || response.units !== 'mm' ||
      plane?.name !== 'XZ' || JSON.stringify(plane.origin_mm) !== '[0,0,0]' ||
      JSON.stringify(plane.normal) !== '[0,1,0]') {
    throw new Error('Unexpected OCCT section reference frame')
  }
  const segments = response.segments
  if (!Array.isArray(segments) || !segments.length || segments.length > 256) {
    throw new Error('Invalid OCCT section edge count')
  }
  for (const segment of segments) {
    if (!Array.isArray(segment) || segment.length !== 2) {
      throw new Error('Invalid OCCT section edge')
    }
    for (const point of segment) {
      if (!Array.isArray(point) || point.length !== 2 ||
          !point.every(value => typeof value === 'number' && Number.isFinite(value) && Math.abs(value) <= 10000)) {
        throw new Error('Invalid OCCT section coordinates')
      }
    }
  }
  return response as unknown as SectionResponse
}

export default function BrepSectionView({
  part, parameters, language, fallback,
}: {
  part: 'circular_plate' | 'solid_shaft' | 'washer' | 'hollow_tube'
  parameters: Record<string, unknown>
  language: Language
  fallback: ReactNode
}) {
  const [state, setState] = useState<SectionState>({ result: null, error: '', pending: true })
  const sequence = useRef(0)
  const specKey = JSON.stringify(parameters)
  useEffect(() => {
    const current = ++sequence.current
    setState({ result: null, error: '', pending: true })
    // Do not reuse old geometry after a parameter edit; ignore late responses
    // even when the Tauri bridge cannot cancel an already executing worker.
    void (async () => {
      try {
        const response = await apiFetch('/api/occt/section', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-OrkiCAD-Client': 'studio' },
          body: JSON.stringify({ type: part, ...JSON.parse(specKey) }),
        })
        const body: unknown = await response.json()
        if (!response.ok) {
          const message = body && typeof body === 'object' && 'error' in body
            ? String((body as { error: unknown }).error) : 'OCCT section failed'
          throw new Error(message)
        }
        const result = parseSection(body)
        if (sequence.current === current) setState({ result, error: '', pending: false })
      } catch (error) {
        if (sequence.current === current) {
          setState({ result: null, error: error instanceof Error ? error.message : String(error), pending: false })
        }
      }
    })()
    return () => { sequence.current++ }
  }, [specKey, part])

  const es = language === 'es'
  const result = state.result
  const radius = part === 'circular_plate'
    ? Number(parameters.outer_radius)
    : part === 'solid_shaft'
      ? Number(parameters.diameter) / 2
      : Number(parameters.outer_diameter) / 2
  const thickness = (part === 'solid_shaft' || part === 'hollow_tube')
    ? Number(parameters.length) : Number(parameters.thickness)
  const scale = Math.min(252 / (2 * radius), 154 / thickness)
  const cx = 200
  const cy = 139
  const xToSvg = (x: number) => cx + x * scale
  const zToSvg = (z: number) => cy + thickness * scale / 2 - z * scale
  return <div className="cad-brep-section">
    {result ? <>
      <svg className="cad-drawing-svg" viewBox="0 0 400 280" role="img"
        aria-label={es ? 'Sección XZ real extraída del sólido B-rep OCCT' : 'Real XZ section extracted from OCCT B-rep'}>
        <rect x="0" y="0" width="400" height="280" fill="#0c1a29"/>
        <g stroke="#627f96" strokeWidth=".7" strokeDasharray="5 4">
          <line x1="12" x2="388" y1={cy} y2={cy}/>
          <line x1={cx} x2={cx} y1="14" y2="264"/>
        </g>
        <g stroke="#9be5e1" strokeWidth="2" fill="none" strokeLinecap="round">
          {result.segments.map(([a, b], i) =>
            <line key={i} x1={xToSvg(a[0])} y1={zToSvg(a[1])}
              x2={xToSvg(b[0])} y2={zToSvg(b[1])}/>)}
        </g>
        <text x="12" y="18" fontSize="10" fill="#a3e9db">XZ · Y=0 · OCCT B-rep</text>
        <text x="388" y="267" textAnchor="end" fontSize="9" fill="#8ba3b6">
          {es ? 'Contornos de intersección · mm' : 'Intersection contours · mm'}
        </text>
      </svg>
      <p className="cad-brep-source" role="status">
        {es
          ? 'Sección geométrica OCCT calculada sobre el sólido B-rep. Contornos reales; rayado y cotas asociativas pendientes.'
          : 'OCCT geometric section of the B-rep solid. Real contours; hatching and associative dimensions are pending.'}
      </p>
    </> : <>
      {fallback}
      <p className="cad-brep-warning" role="status">
        {state.pending
          ? (es ? 'Calculando sección B-rep con OCCT… Vista nominal provisional.' : 'Computing B-rep section with OCCT… Showing temporary nominal preview.')
          : (es ? 'Sección B-rep no disponible: se muestra una vista nominal, NO verificada. '
            : 'B-rep section unavailable: showing UNVERIFIED nominal preview. ')}
        {!state.pending && state.error && <span>{state.error}</span>}
      </p>
    </>}
  </div>
}
