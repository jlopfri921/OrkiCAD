# OrkiCAD AI — Depth estimation and metric multi-photo reconstruction

**Status: technical roadmap and acceptance criteria, not an implemented feature.** Date: 2026-11-16.

## Why depth is required

A single 2D image projects many possible 3D objects onto the same pixels. A visual AI model may infer plausible relative depth but cannot make an uncalibrated image into reliable millimeter measurements. A calibrated multi-image set may recover structure through matched features, camera geometry and triangulation; insufficient texture, reflections, occlusions or narrow baseline can make reconstruction ambiguous. Depth models provide **initial hypotheses and confidence**, not authoritative dimensions.

## Acquisition and reference rules

- Number and store photos with immutable IDs `F01`, `F02`, etc., original filenames, content hashes and view labels. Reference physical features using cross-image feature IDs, e.g. `hole_A_center`.
- Prefer overlapping front/top/side/oblique images and common physical markers. Ask for known physical dimensions: hole spacing, outer diameter, width, thickness, etc.
- A scale ruler in a photograph is useful **only for the corresponding plane and orientation** unless a more complete camera calibration has been performed. Two image points with known separation establish a reference, not arbitrary 3D metric accuracy.
- Distinguish orthographic engineering drawings from photographs with perspective. Never project photo pixels directly onto CAD XY/XZ/YZ without estimating camera pose or manually assigning an alignment.
- Include optional reference targets and camera metadata when available, but never require a proprietary depth camera for the basic pipeline.

## Depth reconstruction stages

1. Detect images, their candidate camera/view types and overlapping feature correspondences; ask the user to confirm uncertain associations.
2. Estimate relative depth or structure from calibrated multiview geometry when feasible (feature matching, structure-from-motion, multi-view stereo); monocular depth is a fallback for rough proposals only.
3. Register to a stable CAD coordinate frame with scale anchors and user-drawn reference points/segments/planes.
4. Fit candidate CAD primitives and feature constraints (planes, cylinders, holes, revolves, profiles), using confirmed dimensional constraints as highest-priority observations.
5. Detect collisions among constraints and ambiguous portions: distinguish **measured**, **user-specified**, **OCR-inferred**, **multi-view estimated**, **monocular guessed**.
6. Reproject the candidate shape into every photo, display deviations and source-linked confidence indicators.
7. Request user review for missing or inconsistent geometry; generate editable CAD feature history only for surfaces and measures that the geometry engine can actually represent.
8. Validate resulting analytic B-rep / mesh and dimensional reports independently before engineering-grade export.

## Confidence contract

| Evidence | Trust for metric dimensions | User-facing label |
| --- | --- | --- |
| Explicit user-confirmed dimension and feature association | Authoritative design constraint unless conflicting | Confirmed |
| Structured validated DXF/vector dimension | Strong, subject to units/source validation | Imported/confirmed |
| OCR-read dimension | Provisional until user confirmation | Needs review |
| Calibrated multiview depth | Estimated with uncertainty/error statistics | Reconstructed estimate |
| Monocular depth and visual reasoning | Relative/approximate only | Visual estimate |
| Unobserved/occluded geometry | Unknown | Missing data |

Never create fabricated tolerances, infer back-side machining solely from appearance, or claim a photo-only reconstruction is an exact STEP. If depth data is insufficient, permit the user to define the necessary dimension or finish the shape manually.

## Minimal demonstration acceptance

- Three photos of a simple measurable L-bracket with overlap, a known width and hole center spacing, marker association, clear ambiguity warnings and a reprojection overlay.
- A plane-calibrated image with two 80 mm reference points; verify that a reference scale does not automatically assign Z thickness.
- Multiple candidate thicknesses in an occluded face must remain unresolved until a measurement is supplied.
- A user-confirmed 10 mm thickness overrides an unconstrained visual depth guess; no silent substitution by model inference.
- Error behavior tested for contradictory OCR vs text or for misassociated features between two images.
- No cloud upload without informed opt-in; local-first processing preferred.

## ComfyUI boundary

Image enhancement, feature/depth estimation and candidate JSON extraction *may* become optional ComfyUI workflow nodes only if the individual pipeline is independently useful, headless, composable, reproducible and validated. Interactive photo calibration, marker assignment, uncertainty review and CAD feature edits belong to Studio Web/Desktop.

See [multiview reference system](MULTIVIEW_PHOTO_REFERENCES.md), [reconstruction master plan](RECONSTRUCTION_MULTIVIEW_PLAN.md), and [restricted ComfyUI policy](COMFYUI_PARITY.md) (the latter may be under review in a separate branch).
