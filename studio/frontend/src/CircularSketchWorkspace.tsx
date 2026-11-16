/** Shared editable XY sketch for shafts, hollow tubes, washers and radial plates.
 * Geometry derived from catalog constraints, never guessed from STL meshes.
 */
import { useState } from 'react'
import type { Language } from './i18n'
import { circularSketchFor, drivingDimension, type SketchCircle, type SketchEntity } from './sketchEntities'

type Props = {
  part: string
  parameters: Record<string, unknown>
  language: Language
  showDimensions: boolean
  onChangeParameter: (field: string, value: number) => void
  editable: boolean
}

const PARAMETER_NAMES: Record<string, { es: string; en: string }> = {
  diameter: { es: 'Diámetro exterior', en: 'Outside diameter' },
  outer_diameter: { es: 'Diámetro exterior', en: 'Outside diameter' },
  outer_radius: { es: 'Radio exterior', en: 'Outer radius' },
  inner_diameter: { es: 'Diámetro interior', en: 'Inner diameter' },
  hole_diameter: { es: 'Diámetro de taladro', en: 'Hole diameter' },
  hole_count: { es: 'Número de taladros', en: 'Hole count' },
  bolt_circle_radius: { es: 'Radio de distribución', en: 'Pitch-circle radius' },
}

export default function CircularSketchWorkspace({
  part, parameters, language, showDimensions, onChangeParameter, editable,
}: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [draft, setDraft] = useState<Record<string, string>>({})
  const es = language === 'es'
  const sketch = circularSketchFor(part, parameters)
  if (!sketch) return <div className="cad-drawing-unsupported" role="alert">
    {es ? 'Croquis no válido: comprueba diámetros, posiciones y separación de taladros.'
      : 'Invalid sketch: check diameters, hole positions and spacing.'}
  </div>
  const viewScale = 108 / sketch.radius
  const cx = 200
  const cy = 139
  const pos = (pt: readonly [number, number]) => [cx + pt[0] * viewScale, cy - pt[1] * viewScale] as const
  const active = sketch.entities.find(x => x.id === selectedId) ?? null
  const activeField = active ? drivingDimension(active) : null
  const lineStyle = (entity: SketchEntity) => ({
    stroke: entity.id === selectedId ? '#ffdda2' :
      entity.kind === 'line' || entity.reference ? '#658da3' : '#8aede1',
    strokeWidth: entity.id === selectedId ? 2.8 : entity.reference ? 0.9 : 1.75,
    strokeDasharray: entity.kind === 'line' || entity.reference ? '5 4' : undefined,
  })
  const focusEntity = (entity: SketchEntity) => {
    if (!editable) return
    setSelectedId(entity.id)
    const field = drivingDimension(entity)
    if (field) document.getElementById('sketch-dim-' + field)?.focus()
  }
  const input = (field: string) => {
    const current = parameters[field]
    const label = PARAMETER_NAMES[field]?.[es ? 'es' : 'en'] ?? field
    return <label key={field}
      className={'sketch-dimension-entry' + (activeField === field ? ' selected' : '')}>
      {label}{field === 'hole_count' ? '' : ' (mm)'}
      <input id={'sketch-dim-' + field} type="number"
        min={field === 'hole_count' ? 1 : 0.001}
        max={field === 'hole_count' ? 64 : undefined}
        step={field === 'hole_count' ? 1 : 0.1}
        value={draft[field] ?? String(current)}
        onChange={event => {
          const raw = event.target.value
          setDraft(d => ({ ...d, [field]: raw }))
          const value = Number(raw)
          if (raw.trim() && Number.isFinite(value) && value > 0 &&
              (field !== 'hole_count' || Number.isInteger(value))) {
            onChangeParameter(field, value)
          }
        }}
        onBlur={() => setDraft(d => { const copy = { ...d }; delete copy[field]; return copy })}
        onKeyDown={event => {
          if (event.key === 'Enter') event.currentTarget.blur()
          if (event.key === 'Escape') {
            setDraft(d => { const copy = { ...d }; delete copy[field]; return copy })
            event.currentTarget.blur()
          }
        }}
        disabled={!editable} />
    </label>
  }
  return <div className="cad-circle-sketch">
    <svg viewBox="0 0 400 280" className="cad-drawing-svg"
      role="group" aria-label={es ? 'Croquis XY editable: círculos, centros y radios'
        : 'Editable XY sketch: circles, centers and radii'}>
      <rect width="400" height="280" fill="#0c1a29" />
      <g stroke="#4d7085" strokeWidth=".7" strokeDasharray="4 5" pointerEvents="none">
        <line x1="14" y1={cy} x2="386" y2={cy}/>
        <line x1={cx} y1="10" x2={cx} y2="270"/>
      </g>
      {sketch.entities.map(entity => {
        if (entity.kind === 'circle') {
          const [x,y] = pos(entity.center)
          const r = entity.radius * viewScale
          const style = lineStyle(entity)
          return <g key={entity.id} className="sketch-entity">
            <circle cx={x} cy={y} r={r} fill="none" {...style} pointerEvents="none"/>
            {editable && <circle cx={x} cy={y} r={r} fill="none" stroke="transparent"
              strokeWidth="14" role="button" tabIndex={0} cursor="pointer"
              aria-label={es ? 'Seleccionar ' + entity.id : 'Select ' + entity.id}
              onClick={() => focusEntity(entity)}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); focusEntity(entity) }
              }} />}
            {entity.id.startsWith('hole-') && <circle cx={x} cy={y} r="1.8"
              fill="#f5d391" pointerEvents="none"/>}
          </g>
        }
        if (entity.kind === 'line') {
          const [x1,y1] = pos(entity.a)
          const [x2,y2] = pos(entity.b)
          return <line key={entity.id} x1={x1} y1={y1} x2={x2} y2={y2}
            {...lineStyle(entity)} pointerEvents="none"/>
        }
        const [x1,y1] = pos([
          entity.center[0] + Math.cos(entity.startRad) * entity.radius,
          entity.center[1] + Math.sin(entity.startRad) * entity.radius,
        ])
        const [x2,y2] = pos([
          entity.center[0] + Math.cos(entity.endRad) * entity.radius,
          entity.center[1] + Math.sin(entity.endRad) * entity.radius,
        ])
        const sweep = ((entity.endRad - entity.startRad) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI)
        const r = entity.radius * viewScale
        return <path key={entity.id}
          d={`M ${x1} ${y1} A ${r} ${r} 0 ${sweep > Math.PI ? 1 : 0} 0 ${x2} ${y2}`}
          fill="none" {...lineStyle(entity)} pointerEvents="none"/>
      })}
      <circle cx={cx} cy={cy} r="2" fill="#ffdaa0" pointerEvents="none"/>
      <text x="12" y="20" fill="#a5cfdf" fontSize="11">XY · (0,0,0) · mm</text>
      {showDimensions && <text x="388" y="270" textAnchor="end" fontSize="10"
        fill="#f6d6a4">{es ? 'Cotas paramétricas nominales' : 'Nominal parametric dimensions'}</text>}
    </svg>
    <div className="cad-circle-sketch-toolbar">
      <strong>{es ? 'Entidades del croquis' : 'Sketch entities'}</strong>
      <span>{sketch.entities.filter((e): e is SketchCircle => e.kind === 'circle').length}
        {es ? ' circunferencias · ' : ' circles · '}
        {sketch.entities.filter(e => e.kind === 'line').length}
        {es ? ' líneas auxiliares' : ' construction lines'}</span>
      {editable && <span>{es
        ? 'Selecciona un contorno para editar su cota. Las líneas auxiliares no modifican directamente la pieza.'
        : 'Select an outline to edit its dimension. Construction lines do not directly modify the part.'}</span>}
      {editable && <div className="sketch-dimension-grid">
        {sketch.editableParameters.map(input)}
      </div>}
      {!editable && <span>{es ? 'Planta nominal XY, no proyección OCCT HLR.'
        : 'Nominal XY plan, not an OCCT HLR projection.'}</span>}
    </div>
  </div>
}
