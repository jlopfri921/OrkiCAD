import { useState } from 'react'
import type { Language } from './i18n'

type Level = 'basic' | 'intermediate' | 'advanced'
type Example = {
  id: string
  level: Level
  title: Record<Language, string>
  prompt: Record<Language, string>
}

/** All referenced part IDs already exist in the Core catalog. */
const EXAMPLES: Example[] = [
  {
    id: 'washer', level: 'basic',
    title: { es: 'Arandela con agujero central', en: 'Washer with center bore' },
    prompt: {
      es: 'Diseña una arandela circular (washer) de diámetro exterior 18 mm, diámetro interior 6,5 mm y espesor 2 mm. El agujero debe atravesar toda la pieza y estar centrado en (0,0).',
      en: 'Design a circular washer with outer diameter 18 mm, inner diameter 6.5 mm and thickness 2 mm. The bore must pass all the way through and be centered at (0,0).',
    },
  },
  {
    id: 'shaft', level: 'basic',
    title: { es: 'Eje cilíndrico macizo', en: 'Solid cylindrical shaft' },
    prompt: {
      es: 'Crea un eje cilíndrico macizo (solid_shaft) de diámetro 12 mm y longitud 80 mm, orientado según el eje Z. No debe tener agujero central.',
      en: 'Create a solid cylindrical shaft (solid_shaft), diameter 12 mm and length 80 mm, oriented along the Z axis. It must not have a central bore.',
    },
  },
  {
    id: 'circular', level: 'basic',
    title: { es: 'Placa circular y cinco taladros', en: 'Circular plate with five holes' },
    prompt: {
      es: 'Diseña una placa circular maciza (circular_plate), nunca cuadrada, de radio exterior 50 mm y espesor 4 mm. Realiza cinco agujeros pasantes de diámetro 3 mm equidistantes cada 72° sobre una circunferencia de radio 20 mm cuyo centro está en el origen (0,0).',
      en: 'Design a solid circular plate (circular_plate), never a square, with outer radius 50 mm and thickness 4 mm. Add five diameter 3 mm through holes, spaced every 72° around a bolt circle of radius 20 mm centered at the origin (0,0).',
    },
  },
  {
    id: 'split_ring', level: 'intermediate',
    title: { es: 'Anillo abierto con cortes radiales', en: 'Open ring with radial cuts' },
    prompt: {
      es: 'Crea un anillo circular con diámetro exterior 40 mm, radio interior 10 mm y un corte completo de 20 mm de longitud sobre el arco exterior, delimitado por dos líneas radiales. Espesor de 4 mm. No quiero ninguna placa rectangular.',
      en: 'Create a circular open ring with outer diameter 40 mm, inner radius 10 mm and a radial sector cut of 20 mm outer arc length, bounded by two radial edges. Thickness 4 mm. No rectangular plate.',
    },
  },
  {
    id: 'mount', level: 'intermediate',
    title: { es: 'Placa de montaje con 4 taladros', en: 'Mounting plate with four holes' },
    prompt: {
      es: 'Crea una placa rectangular (mounting_plate) de ancho 80 mm, fondo 50 mm y espesor 5 mm, con cuatro taladros pasantes de diámetro 5 mm. Los centros de los agujeros están a 10 mm de los dos bordes más cercanos de cada esquina.',
      en: 'Create a rectangular mounting_plate, width 80 mm, depth 50 mm and thickness 5 mm, with four diameter 5 mm through holes. Each hole center is 10 mm from the two nearest edges at its corner.',
    },
  },
  {
    id: 'box', level: 'intermediate',
    title: { es: 'Caja abierta con paredes', en: 'Open box with walls' },
    prompt: {
      es: 'Diseña una caja rectangular abierta por arriba (open_box) de ancho exterior 60 mm, fondo exterior 40 mm, altura 25 mm y espesor uniforme de paredes y suelo de 2 mm. La cavidad interior está vacía y el fondo debe permanecer cerrado.',
      en: 'Design an open-top rectangular box (open_box), outer width 60 mm, outer depth 40 mm, height 25 mm, and uniform 2 mm walls and bottom. The interior must be hollow and the base must remain closed.',
    },
  },
  {
    id: 'bolt', level: 'intermediate',
    title: { es: 'Tornillo métrico M6 Allen', en: 'M6 metric socket screw' },
    prompt: {
      es: 'Genera un tornillo métrico (metric_screw) M6, diámetro 6 mm, paso de rosca 1 mm y longitud 30 mm. Usa cabeza cilíndrica tipo socket y huella hexagonal Allen (hex). Mantén la rosca coherente con el diámetro y paso indicados.',
      en: 'Generate a metric_screw M6, diameter 6 mm, thread pitch 1 mm and length 30 mm. Use a cylindrical socket head and internal hex drive (hex). Keep the thread consistent with the specified diameter and pitch.',
    },
  },
  {
    id: 'corner', level: 'advanced',
    title: { es: 'Placa redondeada con agujeros', en: 'Rounded plate with holes' },
    prompt: {
      es: 'Modela una corner_plate de ancho 90 mm, fondo 55 mm, espesor 6 mm, esquinas redondeadas (corner_style round) de radio 5 mm. Practica dos taladros pasantes de diámetro 6 mm alineados en la línea central del fondo, con distancia a los extremos de 17 mm. No deben intersectar los redondeos.',
      en: 'Model a corner_plate with width 90 mm, depth 55 mm, thickness 6 mm and rounded corners (corner_style round) of radius 5 mm. Add two diameter 6 mm through holes on the depth centerline, with 17 mm end offsets. The bores must not intersect the corner rounds.',
    },
  },
  {
    id: 'machined', level: 'advanced',
    title: { es: 'Bloque mecanizado con cajera', en: 'Machined block with pocket' },
    prompt: {
      es: 'Genera un machined_block de 100 × 60 × 15 mm. Incorpora dos taladros pasantes de diámetro 6 mm a 12 mm de ambos extremos, centrados en el fondo. En la cara superior resta una cajera central de 48 × 30 mm y profundidad 6 mm, dejando suelo macizo. Verifica que taladros y cajera no se solapen.',
      en: 'Generate a machined_block 100 × 60 × 15 mm. Add two diameter 6 mm through holes with 12 mm end offsets, centered along the depth. Cut a central 48 × 30 mm top pocket to depth 6 mm, leaving a solid floor. Ensure the holes and pocket do not overlap.',
    },
  },
  {
    id: 'features', level: 'advanced',
    title: { es: 'Operaciones aditivas y sustractivas', en: 'Additive and subtractive features' },
    prompt: {
      es: 'Crea un feature_model con bloque base de 100 × 60 × 12 mm. Resta una cajera de 48 × 30 × 6,2 mm en [26,15,6], resta dos cilindros de radio 3 mm y altura 12,2 mm en [12,30,-0.1] y [88,30,-0.1], y añade un cilindro de radio 7 mm y altura 8 mm en [50,50,11.8]. Conserva el orden de las operaciones y el origen absoluto.',
      en: 'Create a feature_model with a 100 × 60 × 12 mm base block. Subtract a 48 × 30 × 6.2 mm pocket at [26,15,6], subtract two radius 3 mm, height 12.2 mm cylinders at [12,30,-0.1] and [88,30,-0.1], and add a radius 7 mm, height 8 mm cylinder at [50,50,11.8]. Preserve operation order and the absolute origin.',
    },
  },
]

const TIPS: Record<Language, { title: string; detail: string }[]> = {
  es: [
    { title: 'Define la forma principal', detail: 'Indica si es placa circular, tubo, eje, caja, tornillo o una pieza obtenida mediante operaciones.' },
    { title: 'Da cotas completas en milímetros', detail: 'Especifica diámetro o radio, anchura, fondo, altura, espesor, paso de rosca y holguras cuando correspondan.' },
    { title: 'Ubica taladros y operaciones', detail: 'Añade centros (X,Y,Z), distancia a bordes, diámetro, profundidad, número de agujeros y distribución angular.' },
    { title: 'Aclara qué se suma y qué se resta', detail: 'Diferencia el material macizo, cavidades, cortes pasantes, rebajes y salientes; describe el orden de operaciones.' },
    { title: 'Añade restricciones comprobables', detail: 'Ejemplo: cinco agujeros a 72°, paredes de al menos 2 mm, huecos dentro del contorno y sin solapamientos.' },
    { title: 'Pide solo operaciones disponibles', detail: 'Usa los tipos del catálogo actual. La IA propone parámetros editables; no todas las operaciones CAD complejas están implementadas.' },
    { title: 'Revisa y ajusta la propuesta', detail: 'Comprueba el resultado en el inspector y en el visor. La geometría mostrada y las exportaciones deben validarse antes de fabricar.' },
  ],
  en: [
    { title: 'Name the main shape', detail: 'Say whether it is a circular plate, tube, shaft, box, screw or a part built from ordered operations.' },
    { title: 'Provide complete millimeter dimensions', detail: 'Specify diameter or radius, width, depth, height, thickness, thread pitch and clearance when relevant.' },
    { title: 'Locate holes and features', detail: 'Include centers (X,Y,Z), edge offsets, diameter, depth, hole count and angular spacing.' },
    { title: 'Distinguish additions from cuts', detail: 'Describe solid stock, cavities, through cuts, pockets and bosses, including feature order.' },
    { title: 'Include verifiable constraints', detail: 'For example: five holes every 72°, walls at least 2 mm thick, bores contained within the outline and no overlaps.' },
    { title: 'Request supported features', detail: 'Use the types already in the catalog. AI proposes editable parameters; not every complex CAD operation is implemented.' },
    { title: 'Review and refine the proposal', detail: 'Verify the inspector values and 3D viewer. Validate geometry and exports independently before manufacturing.' },
  ],
}

type Props = { language: Language; onInsert: (prompt: string) => void }

export default function PromptGuide({ language, onInsert }: Props) {
  const [level, setLevel] = useState<Level>('basic')
  const [selectedId, setSelectedId] = useState('circular')
  const [copied, setCopied] = useState(false)
  const available = EXAMPLES.filter(example => example.level === level)
  const selected = available.find(example => example.id === selectedId) ?? available[0]
  const isEs = language === 'es'
  const chooseLevel = (next: Level) => {
    setLevel(next)
    setSelectedId(EXAMPLES.find(example => example.level === next)?.id ?? '')
    setCopied(false)
  }
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(selected.prompt[language])
      setCopied(true)
    } catch {
      onInsert(selected.prompt[language])
      setCopied(false)
    }
  }
  return <div className="prompt-guide">
    <details className="studio-disclosure">
      <summary><span aria-hidden="true">▧</span> {isEs ? 'Ejemplos de diseño por dificultad' : 'Design examples by difficulty'}<span className="disclosure-arrow">⌄</span></summary>
      <div className="prompt-guide-body">
        <label htmlFor="prompt-example-level">{isEs ? 'Nivel de dificultad' : 'Difficulty level'}</label>
        <select id="prompt-example-level" value={level} onChange={e => chooseLevel(e.target.value as Level)}>
          <option value="basic">{isEs ? 'Básico' : 'Basic'}</option>
          <option value="intermediate">{isEs ? 'Intermedio' : 'Intermediate'}</option>
          <option value="advanced">{isEs ? 'Avanzado' : 'Advanced'}</option>
        </select>
        <label htmlFor="prompt-example-choice">{isEs ? 'Ejemplo' : 'Example'}</label>
        <select id="prompt-example-choice" value={selected.id} onChange={e => { setSelectedId(e.target.value); setCopied(false) }}>
          {available.map(example => <option value={example.id} key={example.id}>{example.title[language]}</option>)}
        </select>
        <p className="prompt-example-preview">{selected.prompt[language]}</p>
        <div className="prompt-example-actions">
          <button type="button" className="action-primary" onClick={() => onInsert(selected.prompt[language])}>
            {isEs ? 'Usar en el prompt' : 'Use in prompt'}
          </button>
          <button type="button" className="secondary" onClick={copy}>
            {copied ? (isEs ? 'Copiado' : 'Copied') : (isEs ? 'Copiar ejemplo' : 'Copy example')}
          </button>
        </div>
        <p className="prompt-guide-note">{isEs
          ? 'Ejemplos orientativos para tipos ya registrados. Algunas piezas necesitan OpenSCAD/BOSL2 para mostrar el modelo.'
          : 'Illustrative prompts for registered part types. Some parts require OpenSCAD/BOSL2 to render.'}</p>
      </div>
    </details>
    <details className="studio-disclosure">
      <summary><span aria-hidden="true">◇</span> {isEs ? 'Consejos para escribir un buen prompt CAD' : 'Tips for writing a good CAD prompt'}<span className="disclosure-arrow">⌄</span></summary>
      <div className="prompt-guide-body">
        <p className="prompt-guide-note">{isEs
          ? 'Cuanto más concreta sea la geometría y sus restricciones, menos ambigua resultará la propuesta de IA.'
          : 'Clear geometry and constraints help the AI produce a less ambiguous proposal.'}</p>
        <ol className="prompt-tips">
          {TIPS[language].map(tip => <li key={tip.title}><strong>{tip.title}</strong><span>{tip.detail}</span></li>)}
        </ol>
        <p className="prompt-guide-note">{isEs
          ? 'Estructura recomendada: «Crea [pieza], de [medidas] mm, con [agujeros/operaciones] en [posiciones] y respetando [restricciones]».'
          : 'Recommended structure: “Create [part], [dimensions] mm, with [holes/features] at [positions], respecting [constraints].”'}</p>
      </div>
    </details>
  </div>
}
