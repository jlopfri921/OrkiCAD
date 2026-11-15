/** UI translations. CAD parameter keys and API types are deliberately invariant. */
export const messages = {
  es: {
    language: 'Idioma', units: 'Unidades', metric: 'Métrico (mm)', imperial: 'Imperial (in)', unitNote: 'Las medidas se guardan internamente en mm. Cambiar las unidades no modifica la geometría.', subtitle: 'Studio · Prototipo CAD',
    title: 'Estudio CAD paramétrico',
    intro: 'Configura piezas y genera modelos OpenSCAD y STL con el núcleo Python de OrkiCAD.',
    component: 'Componente', partType: 'Tipo de pieza',
    aiTitle: 'Diseño asistido por IA', aiDescription: 'Describe una pieza y sus medidas. Ollama propondrá un formulario paramétrico editable. No se ejecutará código generado por IA.',
    aiPromptLabel: 'Descripción de la pieza', aiPlaceholder: 'Ejemplo: tapa para una caja de 80 × 50 mm, pared de 2 mm, con holgura de 0,3 mm',
    aiModel: 'Modelo Ollama', aiLocalOnly: 'Conexión local',
    aiInterpret: 'Proponer pieza y parámetros',
    reviewDimensions: 'Revisa todas las medidas: la IA puede haber supuesto valores. No se ha generado ningún STL todavía.',
    dimensions: 'Dimensiones y parámetros',
    generateSCAD: 'Generar SCAD', generateSTL: 'Generar STL y ver en 3D',
    export3MF: 'Exportar 3MF', exportSTEP: 'Exportar STEP (OCCT)',
    working: 'Procesando…', viewer: 'Visor 3D', downloadSTL: 'Descargar STL',
    emptyViewer: 'Genera un STL para visualizar la pieza en 3D.',
    code: 'Código OpenSCAD', downloadSCAD: 'Descargar SCAD',
    help: 'Arrastra para girar y usa la rueda para ampliar. Las piezas mecánicas requieren OpenSCAD y BOSL2.',
    empty: 'Selecciona una pieza y pulsa Generar SCAD. El servidor Python debe estar funcionando.',
    footer: 'Prototipo · Dimensiones internas: mm · Comprueba las medidas y tolerancias antes de fabricar.',
    emptyResponse: 'El servidor CAD no devolvió datos',
    checkServer: 'Comprueba el servidor Python en http://127.0.0.1:8765/api/health',
    wrongResponse: 'Respuesta inesperada del servidor',
    checkVite: 'Comprueba las consolas de Python y Vite.',
    badJSON: 'El servidor devolvió un JSON no válido.',
    noSCAD: 'El servidor CAD no devolvió ningún modelo SCAD.',
    noSTL: 'No se pudo generar el STL',
    wrongSTL: 'El servidor no devolvió un archivo STL',
    emptySTL: 'El archivo STL está vacío o incompleto.',
    parts: {
      washer: 'Arandela', mounting_plate: 'Placa de montaje', open_box: 'Caja abierta',
      metric_screw: 'Tornillo métrico', metric_nut: 'Tuerca métrica', spur_gear: 'Engranaje recto',
      box_lid: 'Tapadera de caja', bottle_cap: 'Tapón de botella',
      corner_plate: 'Placa con esquinas', machined_block: 'Bloque mecanizado', feature_model: 'Modelo por operaciones'
    },
    fields: {
      outer_diameter: 'Diámetro exterior', inner_diameter: 'Diámetro interior',
      thickness: 'Espesor', width: 'Anchura', depth: 'Profundidad',
      hole_diameter: 'Diámetro del agujero', hole_inset: 'Margen del agujero',
      height: 'Altura', wall: 'Grosor de pared', diameter: 'Diámetro',
      pitch: 'Paso de rosca', length: 'Longitud', head: 'Cabeza', drive: 'Accionamiento',
      shape: 'Forma', module: 'Módulo', teeth: 'Dientes',
      shaft_diameter: 'Diámetro del eje', pressure_angle: 'Ángulo de presión',
      box_width: 'Ancho exterior de caja', box_depth: 'Fondo exterior de caja',
      box_wall: 'Grosor de pared de caja', overhang: 'Vuelo de la tapa',
      plug_depth: 'Profundidad del encaje', clearance: 'Holgura',
      neck_outer_diameter: 'Diámetro exterior del cuello',
      top_thickness: 'Espesor de tapa superior', thread_depth: 'Profundidad de rosca',
      corner_style: 'Acabado de esquina', corner_size: 'Tamaño de esquina',
      pocket_width: 'Anchura del vaciado', pocket_depth: 'Fondo del vaciado',
      pocket_cut_depth: 'Profundidad del vaciado', operations: 'Operaciones CAD'
    }
  },
  en: {
    language: 'Language', units: 'Units', metric: 'Metric (mm)', imperial: 'Imperial (in)', unitNote: 'Dimensions are stored internally in mm. Switching units does not change the geometry.', subtitle: 'Studio · CAD prototype',
    title: 'Parametric CAD Studio',
    intro: 'Configure parts and generate OpenSCAD and STL models using the OrkiCAD Python core.',
    component: 'Component', partType: 'Part type',
    aiTitle: 'AI-assisted design', aiDescription: 'Describe a part and its dimensions. Local Ollama proposes an editable parameter form. No AI-generated code is executed.',
    aiPromptLabel: 'Part description', aiPlaceholder: 'Example: lid for an 80 × 50 mm box with 2 mm walls and 0.3 mm clearance',
    aiModel: 'Ollama model', aiLocalOnly: 'Local connection',
    aiInterpret: 'Suggest part and parameters',
    reviewDimensions: 'Review every dimension: AI may have assumed values. No STL has been generated yet.',
    dimensions: 'Dimensions and parameters',
    generateSCAD: 'Generate SCAD', generateSTL: 'Generate STL and view in 3D',
    export3MF: 'Export 3MF', exportSTEP: 'Export STEP (OCCT)',
    working: 'Working…', viewer: '3D viewer', downloadSTL: 'Download STL',
    emptyViewer: 'Generate an STL to view the part in 3D.',
    code: 'OpenSCAD code', downloadSCAD: 'Download SCAD',
    help: 'Drag to orbit and scroll to zoom. Mechanical parts require OpenSCAD and BOSL2.',
    empty: 'Select a part and click Generate SCAD. The local Python server must be running.',
    footer: 'Prototype · Internal dimensions: mm · Check dimensions and tolerances before manufacturing.',
    emptyResponse: 'CAD server returned no data',
    checkServer: 'Check the Python server at http://127.0.0.1:8765/api/health',
    wrongResponse: 'Unexpected server response',
    checkVite: 'Check Python and Vite consoles.',
    badJSON: 'The server returned invalid JSON.',
    noSCAD: 'The CAD server returned no SCAD model.',
    noSTL: 'Could not generate STL',
    wrongSTL: 'The server did not return an STL file',
    emptySTL: 'The STL file is empty or incomplete.',
    parts: {
      washer: 'Washer', mounting_plate: 'Mounting plate', open_box: 'Open box',
      metric_screw: 'Metric screw', metric_nut: 'Metric nut', spur_gear: 'Spur gear',
      box_lid: 'Box lid', bottle_cap: 'Bottle cap',
      corner_plate: 'Corner plate', machined_block: 'Machined block', feature_model: 'Feature model'
    },
    fields: {
      outer_diameter: 'Outer diameter', inner_diameter: 'Inner diameter',
      thickness: 'Thickness', width: 'Width', depth: 'Depth',
      hole_diameter: 'Hole diameter', hole_inset: 'Hole inset',
      height: 'Height', wall: 'Wall thickness', diameter: 'Diameter',
      pitch: 'Thread pitch', length: 'Length', head: 'Head', drive: 'Drive',
      shape: 'Shape', module: 'Module', teeth: 'Teeth',
      shaft_diameter: 'Shaft diameter', pressure_angle: 'Pressure angle',
      box_width: 'Box outer width', box_depth: 'Box outer depth',
      box_wall: 'Box wall', overhang: 'Lid overhang',
      plug_depth: 'Insert depth', clearance: 'Clearance',
      neck_outer_diameter: 'Neck outer diameter',
      top_thickness: 'Top thickness', thread_depth: 'Thread depth',
      corner_style: 'Corner style', corner_size: 'Corner size',
      pocket_width: 'Pocket width', pocket_depth: 'Pocket depth',
      pocket_cut_depth: 'Pocket cut depth', operations: 'CAD operations'
    }
  }
} as const

export type Language = keyof typeof messages
export type Translation = (typeof messages)['es'] | (typeof messages)['en']

export function initialLanguage(): Language {
  const preference = typeof navigator === 'undefined' ? 'en' : navigator.language.toLowerCase()
  return preference.startsWith('es') ? 'es' : 'en'
}
