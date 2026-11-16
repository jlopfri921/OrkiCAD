/** Reusable, dimensionally derived XY sketch geometry.
 *
 * Every entity is a true circle, line segment, or circular arc in mm.
 * This is a sketch UI model, not an OCCT B-rep or independent geometry kernel.
 * IDs are derived from stable catalog roles; we do not pretend STL triangle
 * edges have persistent CAD identity.
 */
export type SketchPoint = readonly [number, number]
export type SketchCircle = {
  kind: 'circle'
  id: string
  center: SketchPoint
  radius: number
  parameter: string | null
  parameterScale: number
  reference?: boolean
}
export type SketchLine = {
  kind: 'line'
  id: string
  a: SketchPoint
  b: SketchPoint
  reference: true
}
export type SketchArc = {
  kind: 'arc'
  id: string
  center: SketchPoint
  radius: number
  startRad: number
  endRad: number
  parameter: string | null
  reference?: boolean
}
export type SketchEntity = SketchCircle | SketchLine | SketchArc
export type SketchModel = {
  entities: SketchEntity[]
  radius: number
  editableParameters: string[]
}

const numeric = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null

/** Catalog-driven, topology-safe construction: no generic rectangle fallback. */
export function circularSketchFor(part: string, params: Record<string, unknown>): SketchModel | null {
  const outerParameter = part === 'solid_shaft' ? 'diameter' :
    part === 'circular_plate' ? 'outer_radius' :
    part === 'washer' || part === 'hollow_tube' ? 'outer_diameter' : null
  if (!outerParameter) return null
  const outer = numeric(params[outerParameter])
  if (outer === null) return null
  const radius = part === 'circular_plate' ? outer : outer / 2
  const entities: SketchEntity[] = [{
    kind: 'circle', id: 'outer-circle', center: [0, 0], radius,
    parameter: outerParameter, parameterScale: part === 'circular_plate' ? 1 : 2,
  }]
  const editableParameters = [outerParameter]

  if (part === 'washer' || part === 'hollow_tube') {
    const bore = numeric(params.inner_diameter)
    if (bore === null || bore >= 2 * radius) return null
    entities.push({
      kind: 'circle', id: 'inner-circle', center: [0, 0], radius: bore / 2,
      parameter: 'inner_diameter', parameterScale: 2,
    })
    editableParameters.push('inner_diameter')
  }

  if (part === 'circular_plate') {
    const hole = numeric(params.hole_diameter)
    const pitch = numeric(params.bolt_circle_radius)
    const count = params.hole_count
    if (hole === null || pitch === null || typeof count !== 'number' ||
        !Number.isInteger(count) || count < 1 || count > 64 ||
        pitch + hole / 2 >= radius ||
        (count > 1 && hole >= 2 * pitch * Math.sin(Math.PI / count))) return null
    entities.push({
      kind: 'circle', id: 'bolt-pattern-reference', center: [0, 0], radius: pitch,
      parameter: 'bolt_circle_radius', parameterScale: 1, reference: true,
    })
    for (let i = 0; i < count; i++) {
      const theta = 2 * Math.PI * i / count
      const center: SketchPoint = [pitch * Math.cos(theta), pitch * Math.sin(theta)]
      entities.push({
        kind: 'circle', id: 'hole-' + i, center, radius: hole / 2,
        parameter: 'hole_diameter', parameterScale: 2,
      })
      entities.push({
        kind: 'line', id: 'pattern-radius-' + i, a: [0, 0], b: center, reference: true,
      })
    }
    editableParameters.push('hole_diameter', 'bolt_circle_radius', 'hole_count')
  }
  return { entities, radius, editableParameters }
}

/** User-editable driving dimension from a picked curve, never inferred from STL. */
export function drivingDimension(entity: SketchEntity): string | null {
  return entity.kind === 'line' ? null : entity.parameter
}

/** Real-world length for a circular-arc selection. */
export function arcLength(arc: SketchArc): number {
  const sweep = ((arc.endRad - arc.startRad) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI)
  return arc.radius * sweep
}
