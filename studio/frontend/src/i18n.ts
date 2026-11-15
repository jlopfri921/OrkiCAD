/** UI translations. CAD parameter keys and API types are deliberately invariant. */
export const messages = {
  es: {
    language: 'Idioma', subtitle: 'Studio · Prototipo CAD',
    title: 'Estudio CAD paramétrico',
    intro: 'Configura piezas y genera modelos OpenSCAD y STL con el núcleo Python de OrkiCAD.',
    component: 'Componente', partType: 'Tipo de pieza',
    dimensions: 'Dimensiones y parámetros',
    generateSCAD: 'Generar SCAD', generateSTL: 'Generar STL y ver en 3D',
    working: 'Procesando…', viewer: 'Visor 3D', downloadSTL: 'Descargar STL',
    emptyViewer: 'Genera un STL para visualizar la pieza en 3D.',
    code: 'Código OpenSCAD', downloadSCAD: 'Descargar SCAD',
    help: 'Arrastra para girar y usa la rueda para ampliar. Las piezas mecánicas requieren OpenSCAD y BOSL2.',
    empty: 'Selecciona una pieza y pulsa Generar SCAD. El servidor Python debe estar funcionando.',
    footer: 'Prototipo · Unidades: milímetros · Comprueba las dimensiones y tolerancias antes de fabricar.',
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
      metric_screw: 'Tornillo métrico', metric_nut: 'Tuerca métrica', spur_gear: 'Engranaje recto'
    },
    fields: {
      outer_diameter: 'Diámetro exterior', inner_diameter: 'Diámetro interior',
      thickness: 'Espesor', width: 'Anchura', depth: 'Profundidad',
      hole_diameter: 'Diámetro del agujero', hole_inset: 'Margen del agujero',
      height: 'Altura', wall: 'Grosor de pared', diameter: 'Diámetro',
      pitch: 'Paso de rosca', length: 'Longitud', head: 'Cabeza', drive: 'Accionamiento',
      shape: 'Forma', module: 'Módulo', teeth: 'Dientes',
      shaft_diameter: 'Diámetro del eje', pressure_angle: 'Ángulo de presión'
    }
  },
  en: {
    language: 'Language', subtitle: 'Studio · CAD prototype',
    title: 'Parametric CAD Studio',
    intro: 'Configure parts and generate OpenSCAD and STL models using the OrkiCAD Python core.',
    component: 'Component', partType: 'Part type',
    dimensions: 'Dimensions and parameters',
    generateSCAD: 'Generate SCAD', generateSTL: 'Generate STL and view in 3D',
    working: 'Working…', viewer: '3D viewer', downloadSTL: 'Download STL',
    emptyViewer: 'Generate an STL to view the part in 3D.',
    code: 'OpenSCAD code', downloadSCAD: 'Download SCAD',
    help: 'Drag to orbit and scroll to zoom. Mechanical parts require OpenSCAD and BOSL2.',
    empty: 'Select a part and click Generate SCAD. The local Python server must be running.',
    footer: 'Prototype · Units: millimetres · Check dimensions and tolerances before manufacturing.',
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
      metric_screw: 'Metric screw', metric_nut: 'Metric nut', spur_gear: 'Spur gear'
    },
    fields: {
      outer_diameter: 'Outer diameter', inner_diameter: 'Inner diameter',
      thickness: 'Thickness', width: 'Width', depth: 'Depth',
      hole_diameter: 'Hole diameter', hole_inset: 'Hole inset',
      height: 'Height', wall: 'Wall thickness', diameter: 'Diameter',
      pitch: 'Thread pitch', length: 'Length', head: 'Head', drive: 'Drive',
      shape: 'Shape', module: 'Module', teeth: 'Teeth',
      shaft_diameter: 'Shaft diameter', pressure_angle: 'Pressure angle'
    }
  }
} as const

export type Language = keyof typeof messages
export type Translation = (typeof messages)['es'] | (typeof messages)['en']

export function initialLanguage(): Language {
  const preference = typeof navigator === 'undefined' ? 'en' : navigator.language.toLowerCase()
  return preference.startsWith('es') ? 'es' : 'en'
}
