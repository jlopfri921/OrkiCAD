/** First exact-parameter SVG orthographic workspace.
 *
 * This is not an import, hidden-line, sectioning or general B-rep projection
 * engine. Only recognized canonical primitives are drawn. Dimensions here are
 * NOMINAL schema values, never measurements of an imported mesh/STEP solid.
 */
import { useState } from 'react'
import BrepSectionView from './BrepSectionView'
import CircularSketchWorkspace from './CircularSketchWorkspace'
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
  onChangeParameter: (field: string, value: number) => void
}

type Primitive = {
  shape: 'rectangle' | 'disk' | 'washer' | 'box' | 'mounting' | 'circular_plate' | 'angle_bracket' | 'machined_block' | 'corner_plate'
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
  wall?: number
  cornerSize?: number
  cornerStyle?: 'round' | 'chamfer'
  pocketWidth?: number
  pocketDepth?: number
  pocketCutDepth?: number
}

const positive = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null

/** Quick user-facing checks. Core remains the source of truth on export. */
export function explainPrimitiveIssue(part: string, p: Record<string, unknown>, language: Language): string | null {
  const es = language === 'es'
  const n = (key: string) => positive(p[key])
  if (part === 'washer' || part === 'hollow_tube') {
    const outer = n('outer_diameter')
    const inner = n('inner_diameter')
    if (outer !== null && inner !== null && inner >= outer) {
      return es ? 'El diámetro interior debe ser menor que el exterior.'
        : 'The inner diameter must be smaller than the outer diameter.'
    }
  }
  if (part === 'circular_plate') {
    const radius = n('outer_radius')
    const pitch = n('bolt_circle_radius')
    const hole = n('hole_diameter')
    const count = p.hole_count
    if (radius !== null && pitch !== null && hole !== null && pitch + hole / 2 >= radius) {
      return es ? 'Los taladros alcanzan o sobrepasan el borde: reduce el radio de distribución o su diámetro.'
        : 'Holes touch or cross the outer edge: reduce the pitch radius or hole diameter.'
    }
    if (pitch !== null && hole !== null && typeof count === 'number' &&
        Number.isInteger(count) && count >= 2 && hole >= 2 * pitch * Math.sin(Math.PI / count)) {
      return es ? 'Los taladros se solapan entre sí en la distribución circular.'
        : 'The holes overlap within the circular pattern.'
    }
  }
  if (part === 'mounting_plate') {
    const width = n('width')
    const depth = n('depth')
    const inset = n('hole_inset')
    const diameter = n('hole_diameter')
    if (width !== null && depth !== null && inset !== null && diameter !== null &&
        (inset <= diameter / 2 || 2 * inset + diameter >= Math.min(width, depth))) {
      return es ? 'Los taladros salen del contorno o se solapan: revisa el margen y el diámetro.'
        : 'Hole bores cross the outline or overlap: revise inset and diameter.'
    }
  }
  if (part === 'angle_bracket') {
    const depth = n('depth'), height = n('height'), thickness = n('thickness')
    if (depth !== null && height !== null && thickness !== null && thickness >= Math.min(depth, height)) {
      return es ? 'El espesor debe ser menor que las dos alas del angular.'
        : 'Thickness must be smaller than both bracket legs.'
    }
  }
  if (part === 'corner_plate') {
    const width = n('width'), depth = n('depth'), corner = n('corner_size')
    const hole = n('hole_diameter'), inset = n('hole_inset')
    if (width !== null && depth !== null && corner !== null && hole !== null && inset !== null &&
        (corner >= Math.min(width, depth) / 2 ||
         inset <= corner + hole / 2 || inset >= width / 2 || hole >= depth)) {
      return es ? 'Los redondeos, chaflanes o taladros no caben en la placa.'
        : 'Corner treatment or holes do not fit inside the plate.'
    }
  }
  if (part === 'machined_block') {
    const width = n('width'), depth = n('depth'), height = n('height')
    const pocketW = n('pocket_width'), pocketD = n('pocket_depth'), cut = n('pocket_cut_depth')
    const hole = n('hole_diameter'), inset = n('hole_inset')
    if (width !== null && depth !== null && height !== null && pocketW !== null &&
        pocketD !== null && cut !== null && hole !== null && inset !== null &&
        (pocketW >= width || pocketD >= depth || cut >= height ||
         inset <= hole / 2 || inset + hole / 2 >= (width - pocketW) / 2 || hole >= depth)) {
      return es ? 'La cavidad o los taladros sobrepasan o se solapan con el bloque.'
        : 'Pocket or holes extend outside or intersect the solid block.'
    }
  }
  if (part === 'open_box') {
    const width = n('width'), depth = n('depth'), height = n('height'), wall = n('wall')
    if (width !== null && depth !== null && height !== null && wall !== null &&
        (2 * wall >= width || 2 * wall >= depth || wall >= height)) {
      return es ? 'La pared es demasiado gruesa para el ancho, fondo o alto de la caja.'
        : 'Wall thickness is too large for the box width, depth or height.'
    }
  }
  return null
}

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
      boltCircleRadius + holeDiameter / 2 < dims.width / 2 &&
      (count === 1 || holeDiameter < 2 * boltCircleRadius * Math.sin(Math.PI / count))
      ? { ...dims, shape: 'circular_plate', holeDiameter, boltCircleRadius, holeCount: count } : null
  }
  if (part === 'mounting_plate') {
    const dims = size(number('width'), number('depth'), number('thickness'))
    const holeDiameter = number('hole_diameter')
    const holeInset = number('hole_inset')
    return dims && holeDiameter !== null && holeInset !== null &&
      holeInset > holeDiameter / 2 &&
      2 * holeInset + holeDiameter < dims.width && 2 * holeInset + holeDiameter < dims.depth
      ? { ...dims, shape: 'mounting', holeDiameter, holeInset } : null
  }
  if (part === 'angle_bracket') {
    const dims = size(number('width'), number('depth'), number('height'))
    const wall = number('thickness')
    return dims && wall !== null && wall < dims.depth && wall < dims.height
      ? { ...dims, shape: 'angle_bracket', wall } : null
  }
  if (part === 'corner_plate') {
    const dims = size(number('width'), number('depth'), number('thickness'))
    const cornerSize = number('corner_size'), holeDiameter = number('hole_diameter')
    const holeInset = number('hole_inset'), cornerStyle = p.corner_style
    return dims && cornerSize !== null && holeDiameter !== null && holeInset !== null &&
      (cornerStyle === 'round' || cornerStyle === 'chamfer') &&
      cornerSize < Math.min(dims.width, dims.depth) / 2 &&
      holeInset > cornerSize + holeDiameter / 2 && holeInset < dims.width / 2 &&
      holeDiameter < dims.depth
      ? { ...dims, shape: 'corner_plate', cornerSize, cornerStyle, holeDiameter, holeInset } : null
  }
  if (part === 'machined_block') {
    const dims = size(number('width'), number('depth'), number('height'))
    const holeDiameter = number('hole_diameter'), holeInset = number('hole_inset')
    const pocketWidth = number('pocket_width'), pocketDepth = number('pocket_depth')
    const pocketCutDepth = number('pocket_cut_depth')
    return dims && holeDiameter !== null && holeInset !== null &&
      pocketWidth !== null && pocketDepth !== null && pocketCutDepth !== null &&
      pocketWidth < dims.width && pocketDepth < dims.depth && pocketCutDepth < dims.height &&
      holeInset > holeDiameter / 2 && holeInset + holeDiameter / 2 < (dims.width - pocketWidth) / 2 &&
      holeDiameter < dims.depth
      ? { ...dims, shape: 'machined_block', holeDiameter, holeInset,
          pocketWidth, pocketDepth, pocketCutDepth } : null
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
  const angleBracket = v.shape === 'angle_bracket'
  const cornerPlate = v.shape === 'corner_plate'
  const machinedBlock = v.shape === 'machined_block'
  // Nominal XZ section: axial for round bodies (Y=0), central plane
  // Y=depth/2 for rectangular catalog parts. Never use STL triangles as B-rep.
  const supportedSection = annular || v.shape === 'disk' ||
    v.shape === 'circular_plate' || v.shape === 'mounting' ||
    v.shape === 'corner_plate' || v.shape === 'machined_block' ||
    v.shape === 'box' || v.shape === 'angle_bracket'
  const radialHoleSlices = v.shape === 'circular_plate' && v.holeCount &&
      v.holeDiameter && v.boltCircleRadius
    ? Array.from({ length: v.holeCount }, (_, i) => {
        const angle = 2 * Math.PI * i / v.holeCount!
        const yOffset = v.boltCircleRadius! * Math.sin(angle)
        const r = v.holeDiameter! / 2
        if (Math.abs(yOffset) >= r) return null
        const halfChord = Math.sqrt(r * r - yOffset * yOffset)
        return { x: v.boltCircleRadius! * Math.cos(angle), width: 2 * halfChord }
      }).filter((slice): slice is { x: number; width: number } => slice !== null)
    : []
  const sectionSolidHeight = angleBracket && v.wall && v.depth / 2 > v.wall
    ? v.wall * scale : rh
  if (isSection && !supportedSection) return <div className="cad-drawing-unsupported">
    {language === 'es'
      ? 'Esta sección necesita un corte geométrico real del motor OCCT (pendiente); no se mostrará una sección inventada.'
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
        : !(cornerPlate && isTop) && !(angleBracket && projection === 'side')
          ? <rect x={left} y={isSection && angleBracket ? top + rh - sectionSolidHeight : top}
            width={rw} height={isSection && angleBracket ? sectionSolidHeight : rh}/>
          : null}
      {angleBracket && !isTop && projection === 'side' && v.wall &&
        <path d={`M ${left} ${top} L ${left + v.wall * scale} ${top}
          L ${left + v.wall * scale} ${top + rh - v.wall * scale}
          L ${left + rw} ${top + rh - v.wall * scale}
          L ${left + rw} ${top + rh} L ${left} ${top + rh} Z`}
          fill="#29455a" stroke="#93e5e2"/>}
      {angleBracket && isTop && v.wall &&
        <line x1={left} x2={left + rw} y1={top + v.wall * scale}
          y2={top + v.wall * scale} stroke="#93e5e2" strokeWidth="1"/>}
      {cornerPlate && isTop && v.cornerSize && (() => {
        const radius = v.cornerSize * scale
        if (v.cornerStyle === 'round') {
          return <path d={`M ${left + radius} ${top} H ${left + rw - radius}
            A ${radius} ${radius} 0 0 1 ${left + rw} ${top + radius}
            V ${top + rh - radius}
            A ${radius} ${radius} 0 0 1 ${left + rw - radius} ${top + rh}
            H ${left + radius}
            A ${radius} ${radius} 0 0 1 ${left} ${top + rh - radius}
            V ${top + radius}
            A ${radius} ${radius} 0 0 1 ${left + radius} ${top} Z`}
            stroke="#93e5e2" fill="#29455a" strokeWidth="1.7"/>
        }
        return <path d={`M ${left + radius} ${top} H ${left + rw - radius}
          L ${left + rw} ${top + radius} V ${top + rh - radius}
          L ${left + rw - radius} ${top + rh}
          H ${left + radius} L ${left} ${top + rh - radius}
          V ${top + radius} Z`}
          stroke="#93e5e2" fill="#29455a" strokeWidth="1.7"/>
      })()}
      {isTop && cornerPlate && v.holeDiameter && v.holeInset &&
        [v.holeInset, v.width - v.holeInset].map((x, i) =>
          <circle key={i} cx={left + x * scale} cy={cy}
            r={v.holeDiameter! * scale / 2} fill="#0c1a29"/>)}
      {isTop && machinedBlock && v.pocketWidth && v.pocketDepth &&
        <rect x={cx - v.pocketWidth * scale / 2} y={cy - v.pocketDepth * scale / 2}
          width={v.pocketWidth * scale} height={v.pocketDepth * scale}
          stroke="#93e5e2" strokeWidth="1.3" fill="#142b3b"/>}
      {isTop && machinedBlock && v.holeDiameter && v.holeInset &&
        [v.holeInset, v.width - v.holeInset].map((x, i) =>
          <circle key={i} cx={left + x * scale} cy={cy}
            r={v.holeDiameter! * scale / 2} fill="#0c1a29"/>)}
      {machinedBlock && !isTop && !isSection && v.pocketWidth && v.pocketDepth && v.pocketCutDepth &&
        <g stroke="#d7b886" strokeDasharray="4 3" strokeWidth=".9" fill="none">
          {projection === 'front' ?
            <>
              <line x1={cx - v.pocketWidth * scale / 2} x2={cx - v.pocketWidth * scale / 2}
                y1={top} y2={top + v.pocketCutDepth * scale}/>
              <line x1={cx + v.pocketWidth * scale / 2} x2={cx + v.pocketWidth * scale / 2}
                y1={top} y2={top + v.pocketCutDepth * scale}/>
            </> :
            <>
              <line x1={cx - v.pocketDepth * scale / 2} x2={cx - v.pocketDepth * scale / 2}
                y1={top} y2={top + v.pocketCutDepth * scale}/>
              <line x1={cx + v.pocketDepth * scale / 2} x2={cx + v.pocketDepth * scale / 2}
                y1={top} y2={top + v.pocketCutDepth * scale}/>
            </>}
        </g>}
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
      {isSection && supportedSection && !annular &&
        <rect x={left} y={angleBracket ? top + rh - sectionSolidHeight : top}
          width={rw} height={angleBracket ? sectionSolidHeight : rh}
          fill="url(#cad-section-hatch)" stroke="#93e5e2" />}
      {isSection && v.shape === 'box' && v.wall && (
        <rect x={left + v.wall * scale} y={top}
          width={(v.width - 2 * v.wall) * scale} height={(v.height - v.wall) * scale}
          fill="#0c1a29" stroke="#93e5e2" />
      )}
      {isSection && v.shape === 'machined_block' && v.pocketWidth && v.pocketCutDepth && (
        <rect x={cx - v.pocketWidth * scale / 2} y={top}
          width={v.pocketWidth * scale} height={v.pocketCutDepth * scale}
          fill="#0c1a29" stroke="#93e5e2" />
      )}
      {isSection && (v.shape === 'corner_plate' || v.shape === 'machined_block') &&
        v.holeInset && v.holeDiameter &&
        [v.holeInset, v.width - v.holeInset].map((x, i) =>
          <rect key={i} x={left + (x - v.holeDiameter! / 2) * scale} y={top}
            width={v.holeDiameter! * scale} height={rh}
            fill="#0c1a29" stroke="#93e5e2" />)}
      {isSection && v.shape === 'circular_plate' &&
        radialHoleSlices.map((hole, i) =>
          <rect key={i} x={cx + (hole.x - hole.width / 2) * scale} y={top}
            width={hole.width * scale} height={rh}
            fill="#0c1a29" stroke="#93e5e2" />)}
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
      {isTop && v.pocketWidth && v.pocketDepth &&
        <text x={cx} y={cy - v.pocketDepth * scale / 2 - 8}
          fill="#f5c889" stroke="none" fontSize="9" textAnchor="middle">
          {fmt(v.pocketWidth)} × {fmt(v.pocketDepth)} mm · {fmt(v.pocketCutDepth ?? 0)} mm
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

export default function DrawingWorkspace({
  mode, part, parameters, language, showDimensions, onToggleDimensions, onChangeParameter,
}: Props) {
  const [projection, setProjection] = useState<Projection>('top')
  const isEs = language === 'es'
  const primitive = describePrimitive(part, parameters)
  const issue = explainPrimitiveIssue(part, parameters, language)
  const view = mode === '2d' ? 'top' : projection
  const useCircularSketch = view === 'top' &&
    (part === 'washer' || part === 'hollow_tube' ||
     part === 'solid_shaft' || part === 'circular_plate')
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
                : (isEs ? 'Sección XZ' : 'XZ section')}
        </button>)}
    </div>}
    <div className="cad-drawing-canvas">
      {useCircularSketch
        ? <CircularSketchWorkspace key={part} part={part} parameters={parameters}
            language={language} showDimensions={showDimensions}
            onChangeParameter={onChangeParameter} editable={mode === '2d'}/>
        : primitive
        ? mode === 'drawings' && view === 'section' &&
          (part === 'circular_plate' || part === 'washer' ||
           part === 'hollow_tube' || part === 'solid_shaft')
          ? <BrepSectionView key={part + JSON.stringify(parameters)}
              part={part} parameters={parameters} language={language}
              fallback={<ProjectionView primitive={primitive} projection={view}
                dimensions={showDimensions} language={language}/>}/>
          : <ProjectionView primitive={primitive} projection={view}
              dimensions={showDimensions} language={language}/>
        :
        <div className="cad-drawing-unsupported" role="status">
          <strong>{issue || (isEs ? 'Vista técnica aún no disponible para esta pieza' : 'Technical view not yet available for this part')}</strong>
          {!issue && <p>{isEs ? 'Esta familia todavía no tiene proyección técnica nominal. La futura proyección OCCT B-rep permitirá representar sus contornos, taladros y líneas ocultas sin inventar geometría.'
            : 'This family does not yet have a nominal technical projection. The future OCCT B-rep projection will derive outlines, bores and hidden edges from actual geometry.'}</p>}
        </div>}
    </div>
    <div className="cad-drawing-details">
      <strong>{isEs ? 'Biblioteca paramétrica compartida' : 'Shared parametric library'}</strong>
      <span>{isEs
        ? 'Edita las cotas en el panel derecho. Esta vista vectorial se regenera al cambiar los parámetros.'
        : 'Edit dimensions in the right inspector. This vector preview updates whenever parameters change.'}</span>
      {mode === 'drawings' && projection === 'section' && primitive &&
        <span className="cad-drawing-scope">{isEs
          ? 'Sección nominal XZ: plano central Y=0 para piezas circulares y Y=fondo/2 para piezas prismáticas. No sustituye a una sección B-rep verificada.'
          : 'Nominal XZ section: Y=0 axis for round parts, Y=depth/2 center for prismatic parts. Not an independently verified B-rep cut.'}</span>}
      <span className="cad-drawing-scope">{isEs
        ? 'Primera fase: vistas nominales de piezas simples. DXF, importación STEP y cortes arbitrarios aún no disponibles.'
        : 'Initial scope: nominal views of simple parts. DXF, STEP import and arbitrary sections are not yet available.'}</span>
    </div>
  </div>
}
