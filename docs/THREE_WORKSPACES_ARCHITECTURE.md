# OrkiCAD IA — Shared CAD 2D / CAD 3D / Drawings & Sections

**Date:** 2026-11-16
**Status:** Workspaces prototype; not a full import/drafting system or manufacturing drawing release.

## Product concept

Three modes in one Studio document and one CAD engine:

1. **CAD 2D:** technical entities/sketches, exact X/Y coordinates, dimensions, geometric constraints, reusable parameterized blocks, AI edit instructions and DXF import/export.
2. **CAD 3D:** parts and future assemblies, 3D features and dimensions, AI-assisted modifications, and prioritized STEP/STP, FCStd, SCAD, STL and 3MF import.
3. **Drawings & sections:** associative orthographic top/front/side projections, arbitrary cutting planes, axial sections, hatching, isometric cutaways, dimension layouts, standards-based drawing sheets and exports.

All three modes must share document identity, coordinate reference, units, parts/features, undo/redo, backend validation, AI approval and an explicit failure state. Changing dimensions in one mode must not silently preserve or export a stale state in another.

## Current MVP on the branch

- Three selectable Studio workspaces, synchronized with the existing part catalog and parameter inspector and AI prompt.
- CAD 2D **nominal SVG top outlines** for washer, solid shaft, hollow tube, circular plate, mounting plate and open-top box.
- Drawings MVP **top XY, front XZ and right-side YZ silhouette** projections for those analytic shapes.
- Axial section preview **only for annular washer/hollow tube**. For other parts a clear unsupported message is shown, never a fabricated section.
- A toggle shared across workspaces showing/hiding nominal parameter dimensions. CAD 3D has a compact nominal-dimension HUD; drawing views have dimension arrows and numeric labels.
- Early geometry consistency checks for annular bores, circular bolt-pattern interference, mounting-plate hole offsets and box walls.
- Candid UI text distinguishing nominal calculated parameters from independently measured CAD mesh geometry.

**Not yet implemented:** importing DXF/STEP/STP/FCStd/SCAD/STL/3MF, a full 2D drawing entity editor, block placement/constraints, OCCT B-rep topological annotations, true hidden-line removal, associative technical drawing sheets, arbitrary sections, isometric cutaways, PDF/DXF technical drawing export, a robust common CAD document schema, AI edits of imported foreign CAD geometry or an undoable command/operation framework. Existing 3D exports remain at their previous level. Do not describe the SVG views as general projections of arbitrary geometry.

## Canonical implementation sequence

### Phase A — Common document model

- Define `CadDocument` with units, immutable entity IDs, coordinate frames, sketches, solids, source assets, external references, schema version and feature history.
- Introduce typed operation commands, validation errors referring to entity/field IDs, preview revision IDs, undo/redo and dependency invalidation between 2D, 3D and drawings.
- Use the existing shared Python Core as authoritative geometry engine, with deterministic processing and explicit unsupported-format errors.

### Phase B — 2D vector engine and blocks

- Build supported entities: point/line/polyline, arcs/circles/ellipses, construction geometry, dimensional/angle constraints, symmetry and pattern operations.
- Add DXF import/export with unit, layer, block and annotation mapping and no execution of external scripts.
- Reusable technical blocks and custom user-defined blocks with insertion points, coordinates, scales and parameter schemas.
- Reuse AI schema validation: natural-language intent -> typed operations -> preview -> explicit approval -> commit.

### Phase C — Import and modify 3D parts

- STEP/STP: accurate imported B-reps through OCCT, exact geometry and partial feature inference, not pretend original feature history exists.
- FCStd: compatibility adapter able to preserve editability only when a suitable FreeCAD runtime and safe document handling exist.
- SCAD: safe parameter extraction and controlled allowlisted generation; no untrusted script execution.
- STL/3MF: triangulated mesh workflow, mesh repair/boolean where supported; no false engineering-grade B-rep precision.
- Mesh and solid conversions must preserve provenance and warn on quality/precision loss.

### Phase D — Associative drafting and sectioning

- Derive top/front/side vector projections and hidden lines using OCCT B-rep HLR; preserve visible/hidden semantics.
- Compute cutting surfaces and section profiles from actual geometry, hatch only material intersections; support arbitrary orientation and isometric cutaways.
- Annotation objects: dimension values from trusted geometry/constraint measurements, associative anchors and a layout engine to avoid overlaps/duplicate dimensions.
- Full technical sheets with title blocks, paper sizes, scales, section labels and standards selectable by project; export vector DXF/PDF/SVG.

### Phase E — AI and automation

- Prompt-to-typed CAD actions to create/modify existing entities, with textual and on-canvas checks and reject infeasible designs before export.
- In drawings, prompt chooses which dimensions/views/sections to present, but never fabricates numerical measurements.
- In assembly, constrain axis/face pairs, apply transforms, check interferences and propagate BOM/drawing updates.

## Dimensioning rules

- **Nominal dimension** is a schema value (today's prototype): not independently checked against STL/STEP geometry.
- **Measured dimension** must come from the authoritative 2D/3D geometry engine, with source/precision recorded.
- **Driving dimension** participates in constraints and can edit parameters/geometry.
- **Reference dimension** is derived, read-only until an explicit operation makes it driving.
- **Tolerance dimension** must distinguish user-defined tolerance from inferred defaults; do not invent manufacturing tolerance.

Dimensions must be hideable, filterable, and anchored to relevant geometry while changing view/zoom. On invalid geometry display concise and localized diagnostics, keep last valid geometry explicitly marked as old, and disallow misleading export.

## Local acceptance

```powershell
cd F:\orkicad-ai-github
.\.venv\Scripts\python.exe -m unittest tests.test_three_workspaces_contract -v
cd studio\frontend
npm run build
npm run dev
```

Check ES/EN, dimensions toggle persistence across tabs, circular hole spacing, hole-overlap warnings, identical parameter changes reflected in supported 2D and orthographic views, explicitly unsupported section/specific part behavior, and no regression in 3D rendering/export. Desktop/Tauri and Windows integration still require actual manual verification.
