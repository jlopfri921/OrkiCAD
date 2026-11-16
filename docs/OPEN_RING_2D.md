# OrkiCAD AI — Anillo abierto con corte radial / Open annular sector

**Estado:** implementación de desarrollo en rama específica, aún sin pasar la aceptación de interfaz Web/Tauri. Esta mejora **no convierte todo el módulo CAD 2D o Planimetría en un editor genérico**.

## Error real identificado

El catálogo no tenía una entidad para un anillo con **dos arcos concéntricos y un sector eliminado delimitado por dos radios**. Algunas peticiones se interpretaban mediante familias rectangulares o arandelas cerradas, y el editor técnico genérico tenía una caída a vistas rectangulares nominales para tipos no reconocidos. Esto no era un problema que pudiera resolverse simplemente cambiando de modelo de IA.

## Modelo correcto para el ejemplo del usuario

- Pieza **circular y anular**, nunca un rectángulo o una arandela cerrada.
- **Ø exterior 40 mm**: se ha supuesto que «pieza circular de 40 mm» indica diámetro, porque la frase no decía «radio». Se presenta esta suposición a la persona usuaria, que puede editarla.
- **Radio interior 10 mm**: hueco circular concéntrico, diámetro interior Ø20 mm.
- **20 mm de arco exterior eliminado**: la **longitud curvilínea del arco** exterior retirado, **no** una cuerda de 20 mm, ni 20 grados.
- **Ángulo del hueco**: theta = s/R = 20/20 = **1 radián = 57,2957795°**.
- Dos lados del corte **radiales**, con extremos sobre los arcos interior y exterior. Cada tramo radial libre mide 10 mm.
- **Espesor de extrusión 4 mm supuesto** porque no se especificó altura. Debe revisarse antes de generar/exportar.

El nuevo tipo `split_ring` modela la geometría con cuatro parámetros: `outer_diameter`, `inner_radius`, `outer_arc_gap` y `thickness`. El núcleo valida que el radio interior sea menor que el exterior y que el arco eliminado no alcance toda la circunferencia.

## Flujo Studio

1. Pegar el texto original en la descripción y pulsar **Proponer pieza y parámetros**. El Core reconocerá la intención anular con corte radial; no podrá sustituirla por un bloque.
2. La propuesta exige revisión y expone las suposiciones sobre 40 mm de diámetro y 4 mm de espesor.
3. Abrir **CAD 2D** para ver el contorno específico XY. Los arcos exterior e interior son seleccionables (ratón/teclado); los segmentos radiales permiten seleccionar la dimensión del arco eliminado.
4. Editar medidas directamente desde el croquis o en el inspector. El croquis se actualiza con geometría coherente.
5. En **Planimetría → Planta XY** se conserva el mismo contorno. Alzado, perfil y sección de esta nueva familia permanecen **pendientes de proyección B-rep**, con aviso explícito, en vez de dibujar un rectángulo falso.
6. En **CAD 3D** se puede generar la extrusión de la región anular restante mediante OpenSCAD; exportaciones STL/3MF dependen de las herramientas locales. La geometría circular se discretiza con segmentos de alta resolución para la malla, por lo que no equivale a un B-rep analítico.
7. `.okad` guarda los cuatro parámetros y permite reconstrucción a través del mismo esquema validado. La exportación STEP para `split_ring` permanece deshabilitada hasta implementar el sólido B-rep analítico.

## Aceptación en Windows

Desde `F:\orkicad-ai-github`:

```powershell
git status --short
git fetch origin
git switch -c prueba-anillo-2d origin/fix/2d-circular-sketch-editing
.\scripts\verify-studio.ps1 -VerifyOCCT
.\Start-OrkiCAD-Web.ps1
```

Verificar que el prompt original crea **split_ring**, no `mounting_plate` ni `corner_plate`; la vista XY tiene dos arcos concéntricos abiertos y dos extremos radiales; el arco exterior eliminado es de 20 mm, radio interior 10, exterior Ø40, con aviso sobre el espesor supuesto. El nuevo croquis permite elegir aristas y editar cotas; la visualización 3D es coherente y `.okad` permite guardar y recuperar. Repetir en Tauri para asegurar paridad. No fusionar sin comprobar Python/TypeScript y la interfaz.

**Futuro:** un editor de croquis genérico, selección topológica OCCT, restricciones geométricas, perfiles arbitrarios, extrusión/revolución y planimetría asociativa con proyecciones B-rep exactas. Ver [issue #13](https://github.com/jlopfri921/orkicad-ai/issues/13).
