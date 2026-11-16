# OrkiCAD AI — Croquis XY circular compartido (hito incremental)

**Estado:** rama de desarrollo, sin integrar ni ejecutar todavía aceptación Web/Tauri. No es aún un editor de croquis libre ni una aplicación de diseño técnico terminada.

## Entidades geométricas reutilizables

`studio/frontend/src/sketchEntities.ts` introduce tipos de entidades 2D en **coordenadas absolutas mm**: `circle`, `arc`, `line`, puntos con coordenadas `[x,y]`, identificadores estables por rol y, cuando existe, un **parámetro conductor** para editar radios o diámetros.

El modelo construye:
- Eje macizo: círculo exterior, edición directa de Ø.
- Arandela: círculos exterior e interior concéntricos, edición de ambos Ø.
- Tubo hueco: misma planta circular concéntrica, edición de ambos Ø.
- Placa circular: perímetro exterior, círculo auxiliar de distribución y taladros colocados a `2πi/n`, con centro exacto y diámetro común; todos los taladros se actualizan cuando se modifican radio de distribución, diámetro o cantidad.
- Anillo abierto: modelo geométrico compartido de dos arcos concéntricos y dos segmentos radiales. El editor de anillos existente reutiliza ese modelo, sin generar cuadriláteros artificiales.

`CircularSketchWorkspace.tsx` pinta los círculos como entidades SVG auténticas, accesibles mediante puntero/teclado. Al seleccionar perímetro exterior, círculo interior, círculo de referencia o agujeros se identifica el parámetro editable. Campos compactos de edición aparecen **dentro del área de dibujo**, evitando añadir un nuevo menú lateral muy alto.

Tanto **CAD 2D** como **Planimetría → Planta XY** utilizan el mismo cálculo de entidades, aunque las cotas se editan directamente solo en CAD 2D por ahora. Los parámetros actualizados alimentan el mismo objeto de diseño que el 3D y el archivo `.okad`. Una vista inválida no se sustituye por un rectángulo.

## Limitaciones deliberadas

- Las entidades se **derivan de las familias del catálogo**; todavía no se pueden dibujar círculos/líneas nuevos a mano arbitrariamente, recortar curvas ni establecer sistemas generales de restricciones.
- La identidad de aristas proviene de roles del croquis, **no de las aristas de triangulación STL ni de nombres topológicos OCCT**. Las aristas del B-rep 3D necesitan otro paso de vinculación.
- La planta es un **croquis vectorial nominal**, no una proyección OCCT HLR con líneas ocultas. No afirmar que las tres vistas y las secciones estén ya verificadas.
- `split_ring` sigue utilizando su visor concreto para controles y extremos radiales, pero ya comparte la definición geométrica analítica `radialRingSketch`.

## Pruebas Windows (rama apilada sobre PR #17)

Desde `F:\orkicad-ai-github`, cuando `git status --short` no muestre cambios:

```powershell
git fetch origin
git switch -c prueba-croquis-compartido origin/feat/shared-circular-sketch-editor
.\scripts\verify-studio.ps1 -VerifyOCCT
```

Para **Web**: `.\Start-OrkiCAD-Web.ps1`, abrir `http://127.0.0.1:8765`. Para **Tauri**: cerrar el servidor previo con Ctrl+C y ejecutar `.\Start-OrkiCAD-Desktop.ps1`. También puede lanzarse Tauri mediante `cd studio\frontend; npm run tauri:dev`, no desde la raíz donde no hay `package.json`.

Pruebas de aceptación: seleccionar arandela, tubo, eje y placa circular; editar Ø exterior/interior mediante clic; comprobar cinco agujeros igualmente distribuidos y su modificación dinámica sin cambiar a rectángulo; ver la misma geometría en Planta XY; guardar y reabrir `.okad`; comprobar STL/STEP según capacidad de cada familia. Si alguna prueba o compilación falla, registrar la traza exacta antes de fusionar.

## Próxima fase

Croquis libre con herramientas de creación de círculos, arcos y líneas, restricciones geométricas, contornos cerrados y extrusión OCCT. Después HLR y secciones asociativas de todos los sólidos.
