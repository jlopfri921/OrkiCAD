# OrkiCAD AI — Primer corte real OCCT B-rep (fase 1)

**Estado:** código en rama de desarrollo; no está integrado ni verificado como versión instalada.

## Alcance implementado

El sólido de prueba es una **placa circular paramétrica** de radio 50 mm, grosor 4 mm, cinco taladros Ø3 mm, radio de distribución 20 mm. El mismo generador OCCT/OCP de sólidos usado por la exportación STEP construye el B-rep. El motor calcula la intersección con el **plano XZ absoluto (Y = 0)** mediante `BRepAlgoAPI_Section` y devuelve los extremos de las aristas de intersección en milímetros.

La petición se valida en el Core de Python; `POST /api/occt/section` se incorpora también a la lista privada de rutas de Tauri. No se ejecuta código arbitrario suministrado por el usuario.

En **Planimetría → Sección XZ**, al seleccionar una placa circular, Web/Tauri solicita las aristas geométricas reales y las muestra con la indicación **«OCCT B-rep»**. Si el motor OCCT no está instalado, tarda demasiado o devuelve un error, se muestra una **vista nominal provisional explícitamente identificada**, sin confundirla con una sección verificada. Una respuesta antigua no sustituye a un modelo cuyas dimensiones se hayan modificado.

La sección es **de contornos**, no una lámina técnica acabada: todavía no tiene sombreado certificado de material, anotaciones asociativas, representación de todas las líneas ocultas ni cortes arbitrarios. Las demás familias de piezas siguen utilizando vistas nominales o indicando que no existe sección disponible.

## Pruebas de aceptación

1. Con el entorno OCCT instalado: `python -m unittest tests.test_occt_section_integration -v`. Debe confirmar aristas exteriores y el taladro que realmente interseca el plano XZ.
2. Ejecutar toda la batería general: `python -m unittest discover -s tests -v`.
3. Compilar Web: `cd studio/frontend && npm run build`.
4. Probar la vista en Web y Tauri seleccionando la placa R50 / 4 / 5×Ø3 / R20, pestaña Planimetría → Sección XZ.
5. Modificar el radio de placa y el radio de distribución; el corte debe actualizarse. No debe mostrarse como actual una respuesta geométrica antigua.
6. Desactivar OCCT o usar un entorno sin `OCP`: debe aparecer la advertencia de **vista nominal no verificada**, no un corte presentado como exacto.
7. Verificar que modelos desconocidos no se representan mediante un rectángulo inventado.

**Dependencia:** el instalador Tauri experimental todavía no incluye un runtime OCCT propio. Puede que la Web local utilice `.venv-occt` y el instalador no; el empaquetado del motor OCCT es otra fase, sujeta a sus licencias y verificaciones.

## Siguientes pasos

- Confirmar que la sección devuelve curvas/aristas del sólido reales en varios sistemas Windows y entornos OCCT.
- Generalizar la extracción B-rep y proyección/ocultación de líneas para todas las familias del catálogo.
- Convertir los contornos en caras de sección con rayado de material, cotas asociativas y formatos técnicos.
- Conectar selección topológica de aristas y operaciones editables en el documento `.okad`, con seguimiento de referencias ante cambios de geometría.
