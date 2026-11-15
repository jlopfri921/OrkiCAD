/** Deterministic top-view manufacturing check, not a substitute for the STL.
 * Its coordinates are computed from the SAME canonical radial parameters
 * used by Python OpenSCAD and OCCT exporters.
 */
type Props = {
  outerRadius: number
  pitchRadius: number
  holeDiameter: number
  holeCount: number
  language: 'es' | 'en'
}

export default function CircularPlatePlan({
  outerRadius, pitchRadius, holeDiameter, holeCount, language,
}: Props) {
  if (!(outerRadius > 0) || !(pitchRadius > 0) ||
      !(holeDiameter > 0) || !Number.isInteger(holeCount) ||
      holeCount < 1 || holeCount > 64) return null
  const size = 250
  const center = size / 2
  const scale = 104 / outerRadius
  const outer = outerRadius * scale
  const pitch = pitchRadius * scale
  const hole = holeDiameter * scale / 2
  const points = Array.from({ length: holeCount }, (_, i) => {
    const angle = 2 * Math.PI * i / holeCount
    return { x: center + pitch * Math.cos(angle),
      y: center - pitch * Math.sin(angle), index: i + 1 }
  })
  return <div className="circular-plan" aria-label={language === 'es'
    ? 'Esquema de la planta circular y matriz de agujeros'
    : 'Circular top-view and hole pattern diagram'}>
    <svg viewBox="0 0 250 250" role="img" aria-label={language === 'es'
      ? 'Placa circular, cinco taladros distribuidos sobre un círculo de radio veinte'
      : 'Circular plate with evenly spaced radial holes'}>
      <circle cx={center} cy={center} r={outer} fill="#294357" stroke="#80e3d4" strokeWidth="2"/>
      <line x1="10" y1={center} x2="240" y2={center} stroke="#64869e" strokeDasharray="3 6"/>
      <line x1={center} y1="10" x2={center} y2="240" stroke="#64869e" strokeDasharray="3 6"/>
      <circle cx={center} cy={center} r={pitch} fill="none" stroke="#f4c77f"
        strokeWidth="1.3" strokeDasharray="5 4"/>
      {points.map(point => <circle key={point.index}
        cx={point.x} cy={point.y} r={hole}
        fill="#0b1726" stroke="#c7f5f0" strokeWidth="1.6"/>)}
      <circle cx={center} cy={center} r="3" fill="#ffffff"/>
      <text x={center + 6} y={center - 9} fontSize="10" fill="#ffffff">0,0</text>
      <line x1={center} y1={center} x2={center + pitch} y2={center}
        stroke="#f4c77f" strokeWidth="1.5"/>
    </svg>
    <div className="circular-plan-facts">
      <strong>{language === 'es' ? 'Planta de la pieza' : 'Part top view'}</strong>
      <span>Ø {2 * outerRadius} mm · {holeCount} × Ø {holeDiameter} mm</span>
      <span>{language === 'es' ? 'Radio de distribución' : 'Pitch radius'}: {pitchRadius} mm</span>
      <span>{language === 'es' ? 'Separación angular' : 'Angular separation'}: {(360 / holeCount).toFixed(2)}°</span>
      <small>{language === 'es'
        ? 'Esquema de control paramétrico. Confirma el resultado con el STL y STEP.'
        : 'Parametric layout check. Verify the final STL and STEP.'}</small>
    </div>
  </div>
}
