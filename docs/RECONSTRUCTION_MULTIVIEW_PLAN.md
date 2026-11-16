# OrkiCAD AI — Drawing/photo-to-CAD reconstruction roadmap

**Status (2026-11-16): proposed future architecture, NOT implemented or verified.**

## Three input modes

1. **Hand sketched parts** — scanned drawing or phone photograph containing outlines and handwritten/typed dimensions; OCR/vision proposes symbols, constraint annotations, sketch primitives and a normalized vector sketch.
2. **Existing technical plan** — vector DXF preferred; also PDF/SVG/rasterized front, top, side and section views. Import entities without assuming a particular dimension scale, projection standard or unit system. Associate views by identifiable reference axes and explicit alignment.
3. **Multiple object photos** — calibrated/multi-view images with dimensions shown in image and/or entered via a user prompt. Extract silhouettes/features, optionally camera calibration, rough geometry and reconstruct an editable analytic CAD model where feasible.

## Ground truth and measurement priorities

- **Known dimensions provided by the user** and confirmed structured DXF constraints are authoritative (after unit and geometric plausibility checks).
- OCR-read dimensions are provisional until reviewed; unreadable or conflicting values must be flagged and must not be guessed.
- Scaled plan measurements are estimates unless verified against a reference dimension and scan correction.
- Photogrammetry / single photo output provides **shape and approximate proportions, not guaranteed millimetric exactness**, even with one reference length. Do not present a mesh as precision STEP without analytic reconstruction and geometric checks.
- Conflict examples: top view says bore Ø8 and profile says Ø10; show both annotations and ask which dimension is intended before committing.
- For underconstrained geometry, propose a plausible feature with explicitly labeled assumptions and uncertainty or require user confirmation, never fabricate a manufacturing-ready design.

## Core processing pipeline

```text
User files + natural-language constraints
    ↓
Format-specific import and safety validation
    ↓
View type, scale, perspective and coordinate normalization
    ↓
OCR/annotations, vector tracing, geometric feature recognition
    ↓
Constraint graph with confidence + provenance per measurement
    ↓
Consistency checking between plan/profile/elevation/photos
    ↓
Typed sketch + feature model preview in CAD 2D / CAD 3D
    ↓
User review and correction of uncertain dimensions/operations
    ↓
Authoritative CAD geometry in OCCT / supported parametric generators
    ↓
Independent dimension inspection, section drawings and exports
```

Each dimension record should include units, input asset ID, view identity, source span/pixel reference or imported CAD entity ID, extraction method, confidence and whether user verified. Geometry operations should be traced to constraints rather than a single flattened mesh.

## UI approach

- **CAD 2D:** open DXF or scanned plan, show original image as locked reference, draw editable vector geometry over it, map recognised dimensions, switch between plan/front/side, prompt modifications.
- **CAD 3D:** side-by-side source assets and reconstructed solid, editable operations/constraints, visual dimension differences and an assumption list.
- **Planimetry and sections:** generate orthographic drawings from confirmed CAD geometry; compare against original views and mark mismatched measurements.
- Provide the workflow states **Imported → Recognized → Needs review → Constrained → Geometry generated → Validated**, with honest failures.

## Implementation order and acceptance gates

1. **DXF 2D import** with units/layers/arcs/lines/blocks and explicit view association; vector geometry remains editable. Test roundtrips and dimension preservation.
2. **Dimensioned raster drawing import** using OCR + editable constraint overlay; validate using simple extruded/machined parts. Reject ambiguous conflicting measures.
3. **Three-view reconstruction** from front/top/side with confidence reports and a constrained set of simple known mechanical shapes. Validate against independent CAD measurements and projected outlines.
4. **Multi-photo reconstruction** with explicit scale calibration and camera/view verification; support approximated shape and only promise precision on dimensions actually constrained and measured.
5. **Broader complex solids/sections** after deterministic OCCT feature reconstruction is stable.

## ComfyUI boundary

Only reuse headless, testable parts of this pipeline if native ComfyUI composition offers value:

- Optional image cleanup/dewarping and OCR as standalone, reviewed outputs.
- Explicit validated vector/sketch/constraint JSON to Core, when the schema is stable.
- Reviewed CAD export as a downstream automation node.

Do **not** export the interactive sketch editor, drawing annotation UI, visual constraint repair, or multi-view face editing as ComfyUI nodes. Never claim an OCR or photo-to-mesh workflow produces a precise editable STEP unless it actually performs verified analytic reconstruction.

## Planned formats

- Inputs: **DXF** (vector), PDF/SVG/PNG/JPEG (drawings), ordered sets of JPEG/PNG/TIFF photos.
- 3D import once supported: STEP/STP, FCStd (optional compatible adapter), SCAD (restricted/trusted), STL, 3MF.
- Outputs: the versioned native OrkiCAD project model, supported STEP/STL/3MF plus technical DXF/PDF/SVG only when the corresponding engines have passed verification.

**Not part of the present production feature set.** Implementation must be tracked separately with tests in the repo and visible status in the Studio UI.
