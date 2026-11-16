/** First exact-parameter SVG orthographic workspace.
 *
 * This is not an import, hidden-line, sectioning or general B-rep projection
 * engine. Only recognized canonical primitives are drawn. Dimensions here are
 * NOMINAL schema values, never measurements of an imported mesh/STEP solid.
 */
import { useState } from 'react'
import type { Language } from './i18n'

type Mode = '2d' | 'drawings'
type Projection = 'top' | 'front' | 'side' | 'section'
type Props = {
  mode: Mode
  part: string
  parameters: Record<string, unknown>
  language: Language
  showDimensions: boolean
  onToggleDimensions: (value: boolean) => void
}

type Primitive = {
  shape: 'rectangle' | 'disk' | 'washer' | 'box' | 'mounting' | 'circular_plate'
  width: number
  depth: number
  height: number
  holeDiameter?: number
  holeInset?: number
  bore?: number
  holeCount?: number
  boltCircleRadius?: number
  innerWidth?: number
  innerDepth?: number
}

const positive = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null

/** Only supported analytic outlines are included. Unknown shapes never turn into boxes. */
export function describePrimitive(part: string, p: Record<string, unknown>): Primitive | null {
  const number = (field: string) => positive(p[field])
  const size = (w: number | null, d: number | null, h: number | null) =>
    w !== null && d !== null && h !== null ? { width: w, depth: d, height: h } : null
  if (part === 'washer') {
    const outer = number('outer_diameter')
    const bore = number('inner_diameter')
    const dims = size(outer, outer, number('thickness'))
    return dims && bore !== null && bore < dims.width ? { ...dims, shape: 'washer', bore } : null
  }
  if (part === 'hollow_tube') {
    const outer = number('outer_diameter')
    const bore = number('inner_diameter')
    const dims = size(outer, outer, number('length'))
    return dims && bore !== null && bore < dims.width ? { ...dims, shape: 'washer', bore } : null
  }
  if (part === 'solid_shaft') {
    const diameter = number('diameter')
    const dims = size(diameter, diameter, number('length'))
    return dims ? { ...dims, shape: 'disk' } : null
  }
  if (part === 'circular_plate') {
    const radius = number('outer_radius')
    const diameter = radius === null ? null : radius * 2
    const dims = size(diameter, diameter, number('thickness'))
    const holeDiameter = number('hole_diameter')
    const boltCircleRadius = number('bolt_circle_radius')
    const count = p.hole_count
    return dims && holeDiameter !== null && boltCircleRadius !== null &&
      typeof count === 'number' && Number.isInteger(count) && count >= 1 &&
      boltCircleRadius + holeDiameter / 2 < dims.width / 2
      ? { ...dims, shape: 'circular_plate', holeDiameter, boltCircleRadius, holeCount: count } : null
  }
  if (part === 'mounting_plate') {
    const dims = size(number('width'), number('depth'), number('thickness'))
    const holeDiameter = number('hole_diameter')
    const holeInset = number('hole_inset')
    return dims && holeDiameter !== null && holeInset !== null &&
      holeInset > holeDiameter / 2 &&
      2 * holeInset < dims.width && 2 * holeInset < dims.depth
      ? { ...dims, shape: 'mounting', holeDiameter, holeInset } : null
  }
  if (part === 'open_box') {
    const dims = size(number('width'), number('depth'), number('height'))
    const wall = number('wall')
    return dims && wall !== null && 2 * wall < dims.width && 2 * wall < dims.depth && wall < dims.height
      ? { ...dims, shape: 'box', innerWidth: dims.width - 2 * wall, innerDepth: dims.depth - 2 * wall }
      : null
  }
  return null
}

function fmt(value: number): string {
  return Number(value.toFixed(3)).toLocaleString('en-US', { maximumFractionDigits: 3 })
}

function ProjectionView({ primitive: v, projection, dimensions, language }: {
  primitive: Primitive; projection: Projection; dimensions: boolean; language: Language
}) {
  const isTop = projection === 'top'
  const isSection = projection === 'section'
  const w = projection === 'side' ? v.depth : v.width
  const h = isTop ? v.depth : v.height
  const scale = Math.min(252 / w, 154 / h)
  const rw = w * scale
  const rh = h * scale
  const left = 200 - rw / 2
  const top = 139 - rh / 2
  const cx = 200
  const cy = 139
  const circle = v.shape === 'disk' || v.shape === 'washer' || v.shape === 'circular_plate'
  const annular = v.shape === 'washer'
  if (isSection && !annular) return <div className="cad-drawing-unsupported">
    {language === 'es'
      ? 'La sección geométrica de esta pieza requiere el motor de cortes B-rep (pendiente). No se inventará un corte.'
      : 'This part needs the B-rep section engine (not yet implemented). No approximate section is presented.'}
  </div>
  return <svg className="cad-drawing-svg" viewBox="0 0 400 280" role="img"
    aria-label={language === 'es' ? 'Vista vectorial nominal, no verificada contra STL' : 'Nominal vector view, not verified against STL'}>
    <defs>
      <pattern id="cad-grid" width="20" height="20" patternUnits="userSpaceOnUse">
        <path d="M 20 0 L 0 0 0 20" stroke="#345369" strokeWidth=".5" fill="none"/>
      </pattern>
      <pattern id="cad-section-hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <line x1="0" x2="0" y1="0" y2="8" stroke="#8ad5c8" strokeWidth="1.4"/>
      </pattern>
      <marker id="cad-dim-arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto-start-reverse">
        <path d="M 0 0 L 6 3 L 0 6" fill="none" stroke="#5ae4d1" strokeWidth="1"/>
      </marker>
    </defs>
    <rect x="0" y="0" width="400" height="280" fill="#0c1a29"/>
    <rect x="0" y="0" width="400" height="280" fill="url(#cad-grid)"/>
    <g stroke="#627f96" strokeWidth=".7" strokeDasharray="5 4">
      <line x1="12" x2="388" y1={cy} y2={cy}/>
      <line x1={cx} x2={cx} y1="14" y2="264"/>
    </g>
    <g stroke="#93e5e2" fill="#29455a" strokeWidth="1.7">
      {isTop && circle
        ? <circle cx={cx} cy={cy} r={rw / 2}/>
        : <rect x={left} y={top} width={rw} height={rh}/>}
      {isTop && annular && v.bore &&
        <circle cx={cx} cy={cy} r={v.bore * scale / 2} fill="#0c1a29"/>}
      {isTop && v.shape === 'circular_plate' &&
        Array.from({ length: v.holeCount ?? 0 }, (_, i) => {
          const angle = 2 * Math.PI * i / (v.holeCount ?? 1)
          const offset = (v.boltCircleRadius ?? 0) * scale
          return <circle key={i} cx={cx + offset * Math.cos(angle)} cy={cy - offset * Math.sin(angle)}
            r={(v.holeDiameter ?? 0) * scale / 2} fill="#0c1a29"/>
        })}
      {isTop && v.shape === 'mounting' &&
        [0, 1].flatMap(ix => [0, 1].map(iy =>
          <circle key={ix + '-' + iy}
            cx={left + (ix ? v.width - (v.holeInset ?? 0) : v.holeInset ?? 0) * scale}
            cy={top + (iy ? v.depth - (v.holeInset ?? 0) : v.holeInset ?? 0) * scale}
            r={(v.holeDiameter ?? 0) * scale / 2} fill="#0c1a29"/>))}
      {isTop && v.shape === 'box' && v.innerWidth && v.innerDepth &&
        <rect x={cx - v.innerWidth * scale / 2} y={cy - v.innerDepth * scale / 2}
          width={v.innerWidth * scale} height={v.innerDepth * scale} fill="#0c1a29"/>}
      {isSection && annular && v.bore &&
        <>
          <rect x={left} y={top} width={(w - v.bore) * scale / 2} height={rh} fill="url(#cad-section-hatch)"/>
          <rect x={cx + v.bore * scale / 2} y={top} width={(w - v.bore) * scale / 2}
            height={rh} fill="url(#cad-section-hatch)"/>
          <rect x={cx - v.bore * scale / 2} y={top} width={v.bore * scale} height={rh} fill="#0c1a29" stroke="#93e5e2"/>
        </>}
      {!isTop && !isSection && annular && v.bore &&
        <g stroke="#d7b886" strokeDasharray="4 3" strokeWidth=".8">
          <line x1={cx - v.bore * scale / 2} x2={cx - v.bore * scale / 2} y1={top} y2={top + rh}/>
          <line x1={cx + v.bore * scale / 2} x2={cx + v.bore * scale / 2} y1={top} y2={top + rh}/>
        </g>}
    </g>
    {dimensions && <g fill="none" stroke="#5ae4d1" strokeWidth="1">
      <line x1={left} y1={top + rh + 7} x2={left} y2={top + rh + 25}/>
      <line x1={left + rw} y1={top + rh + 7} x2={left + rw} y2={top + rh + 25}/>
      <line x1={left} y1={top + rh + 20} x2={left + rw} y2={top + rh + 20}
        markerStart="url(#cad-dim-arrow)" markerEnd="url(#cad-dim-arrow)"/>
      <line x1={left - 7} y1={top} x2={left - 25} y2={top}/>
      <line x1={left - 7} y1={top + rh} x2={left - 25} y2={top + rh}/>
      <line x1={left - 20} y1={top} x2={left - 20} y2={top + rh}
        markerStart="url(#cad-dim-arrow)" markerEnd="url(#cad-dim-arrow)"/>
      <text x={cx} y={top + rh + 36} fill="#9affeb" stroke="none" textAnchor="middle"
        fontSize="11">{circle ? 'Ø' : ''}{fmt(w)} mm</text>
      <text x={left - 32} y={cy} fill="#9affeb" stroke="none" fontSize="11" textAnchor="middle"
        transform={`rotate(-90 ${left - 32} ${cy})`}>{fmt(h)} mm</text>
      {isTop && annular && v.bore && <text x={cx + 10} y={cy - 7} fill="#f5c889" stroke="none" fontSize="10">
        Ø{fmt(v.bore)}
      </text>}
      {isTop && v.holeDiameter && <text x={cx + rw / 2 + 7} y={cy - rh / 2 - 9}
        fill="#f5c889" stroke="none" fontSize="10">Ø{fmt(v.holeDiameter)} {v.holeCount ? '×' + v.holeCount : '×4'}</text>}
    </g>}
    <text x="12" y="17" fontSize="9" fill="#91aabc">{isTop ? 'XY · Z↑' : projection === 'side' ? 'YZ · X→' : 'XZ · Y→'} · (0,0,0)</text>
    <text x="388" y="267" textAnchor="end" fontSize="9" fill="#8ba3b6">
      {language === 'es' ? 'Cotas nominales (mm)' : 'Nominal dimensions (mm)'}
    </text>
  </svg>
}

export default function DrawingWorkspace({ mode, part, parameters, language, showDimensions, onToggleDimensions }: Props) {
  const [projection, setProjection] = useState<Projection>('top')
  const isEs = language === 'es'
  const primitive = describePrimitive(part, parameters)
  const view = mode === '2d' ? 'top' : projection
  return <div className="cad-workspace-body">
    <header className="cad-workspace-tools">
      <div className="cad-workspace-label">
        <strong>{mode === '2d' ? 'CAD 2D' : (isEs ? 'Planimetría y secciones' : 'Drawings and sections')}</strong>
        <span>{isEs ? 'Sistema absoluto XY / XZ · milímetros' : 'Absolute XY / XZ coordinates · millimeters'}</span>
      </div>
      <label className="cad-dimension-toggle">
        <input type="checkbox" checked={showDimensions} onChange={event => onToggleDimensions(event.target.checked)}/>
        {isEs ? 'Mostrar cotas' : 'Show dimensions'}
      </label>
    </header>
    {mode === 'drawings' && <div className="cad-projection-tabs" role="group"
      aria-label={isEs ? 'Seleccionar vista' : 'Select drawing view'}>
      {(['top', 'front', 'side', 'section'] as const).map(item =>
        <button key={item} type="button" className={projection === item ? 'active' : ''}
          aria-pressed={projection === item} onClick={() => setProjection(item)}>
          {item === 'top' ? (isEs ? 'Planta XY' : 'Top XY')
            : item === 'front' ? (isEs ? 'Alzado XZ' : 'Front XZ')
              : item === 'side' ? (isEs ? 'Perfil YZ' : 'Side YZ')
                : (isEs ? 'Sección axial' : 'Axial section')}
        </button>)}
    </div>}
    <div className="cad-drawing-canvas">
      {primitive ? <ProjectionView primitive={primitive} projection={view}
        dimensions={showDimensions} language={language}/> :
        <div className="cad-drawing-unsupported">
          <strong>{isEs ? 'Vista técnica aún no disponible para esta pieza' : 'Technical view not yet available for this part'}</strong>
          <p>{isEs ? 'Utiliza el espacio CAD 3D. La proyección exacta de sólidos complejos necesitará el motor B-rep y un importador CAD.'
            : 'Use the 3D CAD workspace. Exact projections of complex solids will require the B-rep engine and CAD import.'}</p>
        </div>}
    </div>
    <div className="cad-drawing-details">
      <strong>{isEs ? 'Biblioteca paramétrica compartida' : 'Shared parametric library'}</strong>
      <span>{isEs
        ? 'Edita las cotas en el panel derecho. Esta vista vectorial se regenera al cambiar los parámetros.'
        : 'Edit dimensions in the right inspector. This vector preview updates whenever parameters change.'}</span>
      <span className="cad-drawing-scope">{isEs
        ? 'Primera fase: vistas nominales de piezas simples. DXF, importación STEP y cortes arbitrarios aún no disponibles.'
        : 'Initial scope: nominal views of simple parts. DXF, STEP import and arbitrary sections are not yet available.'}</span>
    </div>
  </div>
}
