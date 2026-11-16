/** Editable vector sketch for a concentric open ring.
 * The 20 mm opening is arc length measured on the OUTER perimeter.
 * Both cut sides connect outer and inner radii at constant polar angles.
 */
import { useState } from 'react'
import type { Language } from './i18n'

type Projection = 'top' | 'front' | 'side' | 'section'
type Props = {
  mode: '2d' | 'drawings'
  language: Language
  parameters: Record<string, unknown>
  onChangeParameter: (key: string, value: number) => void
}

export function annularSectorSvg(outerDiameter: number, innerRadius: number, gapArc: number) {
  const outer = outerDiameter / 2
  if (![outer, innerRadius, gapArc].every(x => Number.isFinite(x) && x > 0) ||
      innerRadius >= outer || gapArc >= 2 * Math.PI * outer) return null
  const gap = gapArc / outer // radians: s = R theta
  const start = gap / 2
  const end = 2 * Math.PI - start
  const longArc = end - start > Math.PI ? 1 : 0
  const factor = 115 / outer
  const ro = outer * factor
  const ri = innerRadius * factor
  const p = (r: number, a: number): string => {
    const x = 200 + r * Math.cos(a)
    const y = 139 - r * Math.sin(a)
    return `${x.toFixed(5)} ${y.toFixed(5)}`
  }
  const path = [
    `M ${p(ro, start)}`,
    `A ${ro} ${ro} 0 ${longArc} 0 ${p(ro, end)}`,
    `L ${p(ri, end)}`,
    `A ${ri} ${ri} 0 ${longArc} 1 ${p(ri, start)}`,
    'Z',
  ].join(' ')
  const outerArc = `M ${p(ro, start)} A ${ro} ${ro} 0 ${longArc} 0 ${p(ro, end)}`
  const innerArc = `M ${p(ri, end)} A ${ri} ${ri} 0 ${longArc} 1 ${p(ri, start)}`
  const endCuts = [
    `M ${p(ro, end)} L ${p(ri, end)}`,
    `M ${p(ro, start)} L ${p(ri, start)}`,
  ]
  return { path, outerArc, innerArc, endCuts,
    outerRadius: ro, innerSvgRadius: ri, sweepDegrees: gap * 180 / Math.PI }
}

export default function SplitRingWorkspace({ mode, language, parameters, onChangeParameter }: Props) {
  const [projection, setProjection] = useState<Projection>('top')
  const [selectedEdge, setSelectedEdge] = useState<'outer_diameter' | 'inner_radius' | 'outer_arc_gap' | null>(null)
  const [draft, setDraft] = useState<Record<string, string>>({})
  const es = language === 'es'
  const diameter = Number(parameters.outer_diameter)
  const innerRadius = Number(parameters.inner_radius)
  const outerGap = Number(parameters.outer_arc_gap)
  const thickness = Number(parameters.thickness)
  const geometry = annularSectorSvg(diameter, innerRadius, outerGap)
  const isTop = mode === '2d' || projection === 'top'
  const focusDimension = (key: 'outer_diameter' | 'inner_radius' | 'outer_arc_gap') => {
    setSelectedEdge(key)
    document.getElementById('split-ring-' + key)?.focus()
  }
  const num = (key: string, caption: string) => <label key={key}
    className={selectedEdge === key ? 'split-ring-dimension selected' : 'split-ring-dimension'}>
    {caption}
    <input id={'split-ring-' + key} type="number" step="0.1" min="0.1"
      value={draft[key] ?? String(parameters[key])}
      onFocus={() => {
        if (key === 'outer_diameter' || key === 'inner_radius' || key === 'outer_arc_gap') setSelectedEdge(key)
      }}
      onChange={event => {
        const raw = event.target.value
        setDraft(old => ({ ...old, [key]: raw }))
        const next = Number(raw)
        if (raw.trim() && Number.isFinite(next) && next > 0) onChangeParameter(key, next)
      }}
      onBlur={() => setDraft(old => { const next = { ...old }; delete next[key]; return next })}
      onKeyDown={event => {
        if (event.key === 'Enter') event.currentTarget.blur()
        if (event.key === 'Escape') {
          setDraft(old => { const next = { ...old }; delete next[key]; return next })
          event.currentTarget.blur()
        }
      }}/>
  </label>
  return <div className="cad-workspace-body">
    <header className="cad-workspace-tools">
      <div className="cad-workspace-label">
        <strong>{mode === '2d' ? (es ? 'Croquis 2D · Anillo abierto' : '2D sketch · Open ring')
          : (es ? 'Planimetría · Anillo abierto' : 'Drawing · Open ring')}</strong>
        <span>{es ? 'Plano XY · Cero absoluto (0,0,0)' : 'XY plane · Absolute datum (0,0,0)'}</span>
      </div>
    </header>
    {mode === 'drawings' && <div className="cad-projection-tabs" role="group">
      {(['top', 'front', 'side', 'section'] as const).map(item =>
        <button key={item} type="button" className={projection === item ? 'active' : ''}
          onClick={() => setProjection(item)} aria-pressed={projection === item}>
          {item === 'top' ? (es ? 'Planta XY' : 'Top XY') :
           item === 'front' ? (es ? 'Alzado XZ' : 'Front XZ') :
           item === 'side' ? (es ? 'Perfil YZ' : 'Side YZ') :
           (es ? 'Sección XZ' : 'XZ section')}
        </button>)}
    </div>}
    <div className="cad-drawing-canvas">
      {!geometry ? <div className="cad-drawing-unsupported" role="alert">
        {es ? 'Geometría inválida: el radio interior debe ser menor que el exterior y el arco eliminado debe ser menor que la circunferencia.'
          : 'Invalid geometry: inner radius must be smaller than outer radius and gap must be shorter than the circumference.'}
      </div> : isTop ?
        <svg className="cad-drawing-svg" viewBox="0 0 400 280" role="group"
          aria-label={es ? 'Anillo circular abierto, dos arcos concéntricos y dos cortes radiales' : 'Open annular ring, concentric arcs and radial cuts'}>
          <rect width="400" height="280" fill="#0c1a29"/>
          <g stroke="#54768c" strokeWidth=".7" strokeDasharray="5 5">
            <line x1="70" y1="139" x2="330" y2="139"/>
            <line x1="200" y1="14" x2="200" y2="264"/>
          </g>
          <path d={geometry.path} fill="#2b5065" stroke="#7febe2" strokeWidth="2" strokeLinejoin="round"/>
          {([
            ['outer_diameter', geometry.outerArc],
            ['inner_radius', geometry.innerArc],
            ['outer_arc_gap', geometry.endCuts.join(' ')],
          ] as const).map(([field, edge]) => <g key={field}>
            {selectedEdge === field && <path d={edge} fill="none"
              stroke="#f9d99a" strokeWidth="4" pointerEvents="none"/>}
            <path d={edge} fill="none" className="split-ring-edge-hit"
              stroke="transparent" strokeWidth="16" cursor="pointer"
              role="button" tabIndex={0}
              aria-label={field === 'outer_diameter'
                ? (es ? 'Seleccionar arco exterior y editar diámetro' : 'Select outer arc and edit diameter')
                : field === 'inner_radius'
                  ? (es ? 'Seleccionar arco interior y editar radio' : 'Select inner arc and edit radius')
                  : (es ? 'Seleccionar cortes radiales y editar arco eliminado' : 'Select radial cuts and edit removed arc')}
              onClick={() => focusDimension(field)}
              onKeyDown={event => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  focusDimension(field)
                }
              }}/>
          </g>)}
          <circle cx="200" cy="139" r="2" fill="#f9d99a"/>
          <text x="12" y="20" fill="#afdacf" fontSize="11">XY · (0,0,0) · mm</text>
          <text x="200" y="271" fill="#a7e8db" textAnchor="middle" fontSize="11">
            Ø{diameter} · Ri {innerRadius} · {outerGap} mm {es ? 'de arco exterior' : 'outer arc length'}
          </text>
          <text x="380" y="20" textAnchor="end" fill="#f9d99a" fontSize="10">
            Δθ {geometry.sweepDegrees.toFixed(3)}°
          </text>
        </svg> :
        <div className="cad-drawing-unsupported" role="status">
          <strong>{es ? 'Esta vista requiere proyección B-rep' : 'This view requires B-rep projection'}</strong>
          <p>{es ? 'La planta XY es exacta según los parámetros. No mostramos un rectángulo falso en alzado, perfil o sección hasta calcular la geometría OCCT.'
            : 'The XY outline follows the exact parameters. Front, side and section will not be fabricated as rectangles before OCCT projection.'}</p>
        </div>}
    </div>
    <div className="cad-drawing-details">
      <strong>{es ? 'Editar croquis circular · Selecciona los arcos o cortes radiales' : 'Edit circular sketch · Select arcs or radial cuts'}</strong>
      <div className="split-ring-dimensions">
        {num('outer_diameter', es ? 'Diámetro exterior (mm)' : 'Outside diameter (mm)')}
        {num('inner_radius', es ? 'Radio interior (mm)' : 'Inner radius (mm)')}
        {num('outer_arc_gap', es ? 'Arco exterior eliminado (mm)' : 'Removed outer arc (mm)')}
        {num('thickness', es ? 'Espesor de extrusión (mm)' : 'Extrusion thickness (mm)')}
      </div>
      <span className="cad-drawing-scope">{es
        ? 'Los dos extremos del corte siguen radios del mismo centro. Se puede modificar cada cota y se actualiza el croquis y el modelo 3D.'
        : 'Both cut ends are radial. All four dimensions drive the 2D sketch and the 3D solid.'}</span>
    </div>
  </div>
}
