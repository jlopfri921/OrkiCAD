# OrkiCAD AI — Parametric feature operations and transitions

**Status:** architecture/design contract for staged implementation, not an assertion that an editable OCCT operation engine already exists.
**Date:** 2026-11-16. **Canonical units:** millimeters and degrees, with explicit coordinate frames.

## Goal and terminology

Users should be able to select a 2D profile or an existing CAD face and request a controlled modeling operation, with a preview, editable parameters, geometry validation, dependency tracking, undo/redo and a deterministic result.

- **Extrude / pad:** linearly extend a closed planar region along a vector by a signed distance; support symmetric-to-plane extrusion, additive solid or subtractive cut. Reject an open wire as a solid unless explicit surface/thin-wall mode exists.
- **Revolve:** sweep a closed planar region through a specified angular span around an axis defined by a point plus a direction. Allow 30°, 90°, 180°, 270°, 360° and arbitrary valid angles. Separate additive revolutions from subtractive grooves. Detect axis/profile degeneracy, self-intersection and invalid solids.
- **Loft / transition between profiles:** construct a solid or surface joining two or more named cross-sections on positioned sketch planes. A circle-to-rectangle transition is a **loft**, not merely a mesh morph. Validate section order, continuity, profile closure, vertex mapping and optional rails; prompt for underconstrained correspondence.
- **Sweep along path:** follow line/arc/spline rails with a profile and an explicit orientation/twist law. This is different from revolve: no single fixed rotational axis is required.
- **Boolean:** cut, fuse, intersect, with stable target and tool IDs and an explicit result validation.
- **Transforms:** translate/rotate/mirror/scale in clearly identified local or absolute coordinates. A geometric transform does not automatically modify driving sketch dimensions.

## Operation contract (illustrative; not yet accepted as runtime schema)

```json
{
  "schema": "orkicad.feature-command/0.1-draft",
  "operation_id": "op-004",
  "kind": "revolve",
  "source_sketch_id": "sketch-profile-02",
  "mode": "add",
  "axis": {
    "frame_id": "world",
    "point_mm": [0, 0, 0],
    "direction": [0, 0, 1]
  },
  "angle_deg": 225,
  "reverse": false,
  "validate_solid": true,
  "approval": "pending"
}
```

Example user prompts (Spanish):

- `Extruye el perfil cerrado B01 20 mm según +Z y añádelo al sólido principal.`
- `Revoluciona el croquis P02 270° alrededor del eje global Y pasando por (0,0,0).`
- `Crea una transición suave (loft) entre el círculo C01 de Ø30 mm en Z=0 y el rectángulo R01 de 40 × 20 mm en Z=70; mantén las dos secciones.`
- `Barre el perfil C01 siguiendo la curva guía T01 sin torsión perceptible; comprueba interferencias.`
- `Realiza un vaciado con revolución de 180° alrededor del eje local L01.`

## Implementation order (gated)

1. **Core typed sketch IDs and references:** planar closed wires, units, geometric constraint validation and stable source IDs. Without persistent IDs, feature edits are unreliable.
2. **Extrusion:** controlled directions, distances, symmetric and cut/add modes, native OCCT shape validation and tests for dimensions and volume.
3. **Revolution:** axis selection by two points or datum axis, partial/full angle, sign, cut/add, tolerance checks and degenerate-profile errors.
4. **Loft between profiles:** first support simple closed planar sections of compatible topology, then circle-to-rectangle and other explicitly supported transitions with orientation/section-order controls.
5. **Sweeps:** rail geometry, tangency/turning behavior, optional guide sections and twist law.
6. **UI and AI:** add operation history, selected entity highlighting, structured prompt-to-command proposal, read-only preview, approvals and undo/redo; never execute model-generated raw code.
7. **Projection parity:** any supported operation must update drawing sections/dimensions from actual generated geometry; never use an obsolete STL to claim numeric accuracy.

## Acceptance and failure behavior

- Validated parameter bounds (nonzero length, valid angular span, normalized axis, valid closed profiles and non-self-intersecting profiles).
- Full/partial revolutions must produce actual supported B-rep solids/surfaces, not simply shaded mesh illusions.
- Loft must not silently twist profiles or swap corners; user can inspect section correspondence.
- Export STEP/STL and compare topological validity, bounding box, volume and relevant exact/derived dimensions against the validated Core shape.
- If the operation cannot be computed, display a localized error, keep the last valid solid explicitly tagged as old, block export of stale geometry and let the user adjust the sketch or parameters.
- Record provenance of derived profiles from photographs, including uncertain inferred depths, so a dimension cannot silently become authoritative.
- For ComfyUI, only expose **headless validated** extrusion/revolution/loft commands after real Core execution and workflow acceptance. Never port interactive editors into nodes.

**No current UI or generated STL is evidence that these features have passed the above acceptance gates.**
