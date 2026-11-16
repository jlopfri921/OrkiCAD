# OrkiCAD AI — Reverse engineering of existing physical parts

**Status (2026-11-16): product requirement and implementation plan, not an operational reconstruction pipeline.**

## Objective

Recreate an existing mechanical part as a **measurable, editable and verifiable parametric CAD model**, not merely a visually similar mesh. Work from a physical sample, 3D scan, existing STL/3MF, reference photos, drawings, or STEP/STP/FCStd/SCAD source files when legally and technically supported.

The system must distinguish **reference reproduction** (make a CAD model of what exists), **functional redesign** (modify fit or performance under user-selected constraints), **mesh repair**, and **visual-only reconstruction**. Never label a photogrammetric mesh as a dimensional digital twin without measurement evidence.

## Supported input classes (staged, not currently all importable)

| Reference | What can be recovered | Main limitation |
| --- | --- | --- |
| STEP / STP with analytic B-rep | Exact surfaces, topology, holes/fillets often identifiable | Original design constraints and feature history normally absent |
| Native FCStd | Potentially original sketch/feature data if compatible FreeCAD runtime | Version-dependent, untrusted document parsing and external dependencies |
| Trusted/restricted SCAD | Parameter expressions and construction logic if safely parsed | Source scripts may contain external includes or executable behavior |
| STL / 3MF | Measured triangle mesh, approximate analytic surfaces and likely feature candidates | Triangulation is not a native parametric solid; 3MF may have transforms/units/components |
| DXF / orthographic drawings | 2D entities, dimensions, cross-view constraints and profiles | Hidden features may be underdetermined |
| Hand sketch / photos / scan | Silhouette, candidate edges, visual/metric anchors | Perspective, depth uncertainty, reflections, occlusions and scale calibration |
| Calipers / micrometer / ruler / hole gauge / CMM | User-confirmed dimensions and tolerances | Measurement method/uncertainty must be recorded |

## Distinct reverse-engineering modes

1. **Import and inspect:** show original geometry and units, mesh integrity, approximate bounding box, source provenance, known dimensions and unresolved values.
2. **Align and calibrate:** choose absolute XYZ datum, part orientation, scales and origin; tie physical measurements and photo IDs (F01...) to persistent geometric markers (P01/D01/C01/S01).
3. **Recognize candidate features:** identify planes, cylinders, holes, slots, revolved bodies, grooves, chamfers, symmetric elements, patterns and likely manufacturable operations. All are *proposals* with confidence and links to original evidence.
4. **Reconstruct editable parametric design:** fit analytic primitives/sketches and build a feature tree (base sketch, extrude, revolve, loft, sweep, cuts and patterned features). Support mixed manual/AI-assisted corrections and preserved references.
5. **Validate:** compare source/reference versus reconstructed model with section overlays, deviation/clearance maps, confirmed dimensions, volume and topology checks, units and explicit error/confidence thresholds. **Measured dimensions win over visual predictions** unless user resolves a contradiction.
6. **Export:** save the native OrkiCAD project with history/provenance plus STEP/STP and STL/3MF only for supported geometry paths. Distinguish original source, approximation and reviewed reconstruction.

## UI design

- Entry point in **CAD 3D → Import → Reverse engineer**, with optional entry from CAD 2D drawings.
- Persistent side-by-side or overlay preview: original mesh/photo/plan vs recovered CAD. Select a plane/hole on the original reference, assign a measurement, and observe corresponding feature in the reconstructed tree.
- **Measure tools** for point-point distance, diameter, radius, angle, wall thickness and hole spacing. Offer dialed-in values from real measuring instruments, image reference markers or imported vector dimensions with source labels.
- **Parameter action** on feature recognition: confirm, reject, split, merge, redefine sketch, change operation and select datum; provide quick prompts describing a target or constraint.
- **Inspection report:** deviations, RMS and maximum errors only when a technically valid comparison exists; mark ranges and unknown regions; preserve source and units. No invented tolerance passes.

## Technical approach and priority

**Stage R0: shared Core and provenance (prerequisite).**
Versioned design document with source assets, stable IDs, coordinate frames, constraints, typed commands, history, undo, validation and tolerances.

**Stage R1: analytic B-rep STEP reverse engineering.**
Import STEP via OCCT, select and classify faces/cylinders, recreate a constrained simple plate/shaft/bracket sketch, re-export STEP and verify unit/dimension/shape parity. Feature recognition is initially interactive, not magical complete history recovery.

**Stage R2: STL/3MF mesh-based reverse engineering.**
Import securely; validate mesh/manifoldness/units. Fit planes/cylinders, measure residuals, reconstruct an editable sketch and analytic features where possible; report poor mesh quality and ambiguous cases. Mesh-to-STEP is not guaranteed precise merely by wrapping triangles.

**Stage R3: engineering drawings and photographs.**
Integrate DXF+three-view alignment, photo Fxx references, pixel markers and scale-depth calibration. Require user confirmation of OCR measurements and explicitly report missing depth.

**Stage R4: semi-automatic feature tree inference.**
Generate ordered extrusion/revolution/loft/sweep/boolean operation proposals from candidate geometry and constraints, validate them and allow user approval or manual correction.

**Stage R5: functional variants, assemblies and inspection.**
Analyze fits/clearances of connected parts, matching features, allowances and design changes; preserve engineering intent, revisions, and provenance.

## Minimum engineering acceptance

- On a sample **STEP plate with two measured holes**, identify the bounding dimensions and candidate circles, reconstruct an editable model, produce STEP again and check diameter/center distance independently.
- On an STL of the same plate with known physical dimensions, fit the hole radius and report approximation error; original and recovered STEP dimensions must not be claimed identical unless checked.
- On a scanned/photographed L-bracket, a known 10 mm thickness is a confirmed parameter; an AI-predicted value stays provisional, with marker/source links.
- Reject geometries that contradict established constraints and provide highlighted discrepancies, not silent distortions.
- Verify that photo/scan sources are kept local unless explicit cloud consent is given; imports and parsed formats are resource-bounded.

## Minimal ComfyUI boundary

The standalone Web/Desktop app is the reverse-engineering editor. ComfyUI may later host limited, tested **headless** workflows (e.g. mesh inspection, OCR candidate extraction, validated feature/measurement report) **only after** shared Core runtime acceptance. Camera marker placement, 2D sketch correction, interactive face classification, deviation review and parametric history repair stay in Studio. See [ComfyUI scope policy (PR #5)](https://github.com/jlopfri921/orkicad-ai/pull/5).

## Related design specifications

- [Three-space roadmap](../ROADMAP.md)
- [Multiple-photo references](MULTIVIEW_PHOTO_REFERENCES.md)
- [Depth reconstruction](DEPTH_RECONSTRUCTION_PLAN.md)
- [Image/plan-to-CAD pipeline](RECONSTRUCTION_MULTIVIEW_PLAN.md) (under review in PR #5)
- [Extrude / revolve / loft / sweep operations](FEATURE_OPERATIONS_SPEC.md)

Reverse engineering is a **core product line** and must have its own tracked milestones and tests, not merely appear in the optional ComfyUI scope.
