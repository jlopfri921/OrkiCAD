# Drawing, photo and multi-view reconstruction

## Inputs
Technical drawings (raster/PDF), sketches, one photo, multiple views, annotated measurements and text-based dimensional constraints.

## Pipeline
1. **Ingest**: detect format, strip malicious or unexpected content, preserve originals.
2. **Understand**: OCR labels and dimensions; detect lines, silhouettes, edges, holes and camera/view metadata.
3. **Associate measurements**: map measurement annotations and free-text dimensions to specific geometry; track units and confidence.
4. **Calibrate**: known reference length, scale ruler, camera calibration or explicit dimensional constraints.
5. **Reconstruct**: 2D profiles, solids, multi-view mesh or hybrid CAD model.
6. **Verify**: consistency across views, bounding dimensions, tolerances and reconstructed features.
7. **Export**: mesh formats for visual/printing use, solid CAD formats only after successful solid reconstruction.

## Critical limitation
A photo (even multiple photos) may not uniquely determine geometry or absolute scale. Where dimensions are ambiguous, request user review or flag results as approximate. Never claim metrology-grade accuracy without calibration and measured validation.

## First planned examples
- Scanned plate drawing + one known dimension → SVG/DXF → constrained solid.
- Photograph of a bracket with handwritten dimensions → candidate STEP + measurement report.
- Four views of an object with calibration ruler → reconstruction candidate → GLB/STL.
