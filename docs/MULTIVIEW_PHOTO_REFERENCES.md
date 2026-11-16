# OrkiCAD AI — Referencing measured points in multiple photographs

**Status: approved design requirement, not yet an implemented import/editor.**
**Scope:** CAD 2D, CAD 3D, reconstruction and dimension verification. Date: 2026-11-16.

## User workflow

1. **Upload a photo set** into one reconstruction job. Assign stable, human-readable identifiers `F01`, `F02`, … automatically, preserving order of ingestion. Original filename, content checksum and upload metadata are stored. Renaming/reordering photos must not change their stable IDs.
2. **Declare each image's view**: top/plan (XY), front/elevation (XZ), side/profile (YZ), isometric, detail, unknown. The suggestion may come from image analysis, but the user can change it. Assign a camera/view coordinate frame and optionally front/back/up orientation; do not assume a camera frame is the same as global CAD XYZ.
3. **Calibrate scale** whenever image measurement is requested: preferably a ruler in the same plane as the measured feature, a reference target of known length, or two points with a known physical separation. For perspective images, solve orientation/homography *only for the identified plane*. Distinguish known, assumed and uncalibrated camera parameters.
4. **Annotate the photograph** with interactive markers of four types: point `P01`, segment `D01: P01↔P02`, circle `C01` (center and perimeter), or plane/face `S01`. Markers display over the photo and link to specific CAD entities/feature IDs. A selected CAD hole highlights all linked annotations across images.
5. **Attach measurements to each target**. A dimension annotation requires a source (manual prompt, manually entered, OCR tentative, CAD measurement), unit, exact photo ID(s), target point/segment/face ID(s), measure type, and status (confirmed/needs_review/rejected).
6. **Cross-reference views** using the same physical feature ID (e.g. `hole_A_center`) across `F01` and `F03`. Registration/reprojection may align photos, but do not silently equate same pixel coordinates with same world location.
7. **Review conflicts**: do not overwrite contradictory measurements. Show alternatives and source images side by side. Incompatible values must block automatic geometry approval until an explicit user decision.
8. **Preview reconstructed geometry**, its constraints, assumptions, provenance and predicted outlines projected back on each uploaded image.
9. **Commit** a versioned, editable CAD project with the linked source images and annotation metadata. Allow undo/redo of marker and measurement edits.

## A structured prompt convention

The interface should insert references when the user clicks image markers. Examples:

- `En F01 (planta), P01-P02 = 80 mm; ambos son centros de taladros.`
- `En F02 (alzado), D03 = 12 mm de espesor; la base es paralela al plano XY.`
- `En F03 (perfil), el arco C02 tiene radio 15 mm y centro en P06.`
- `El agujero A se ve en F01 y F02; diámetro confirmado Ø6 mm. No deducir otras cotas sin consultar.`

The prompt parser must not treat unbound text such as "80 mm in photo 2" as a reliable entity location: propose a candidate target and request the user to attach it to a marker or click the geometry. Reference IDs must survive sorting and translation (Spanish/English); meaningful marker names may be localized.

## Canonical annotation example (illustrative; no parser yet)

```json
{
  "schema": "orkicad.multiview-reference/0.1-draft",
  "units": "mm",
  "images": [
    {"id": "F01", "file": "planta.jpg", "view": "top", "calibration": {
      "method": "two_points", "point_ids": ["P01", "P02"], "known_distance_mm": 80,
      "plane_id": "S01", "status": "confirmed"
    }},
    {"id": "F02", "file": "alzado.jpg", "view": "front", "calibration": {"status": "uncalibrated"}}
  ],
  "markers": [
    {"id": "P01", "image_id": "F01", "kind": "point", "pixel": [132, 204], "feature_id": "hole_A_center"},
    {"id": "P02", "image_id": "F01", "kind": "point", "pixel": [450, 202], "feature_id": "hole_B_center"},
    {"id": "D01", "image_id": "F01", "kind": "distance", "point_ids": ["P01", "P02"]}
  ],
  "measurements": [
    {"id": "M01", "source": "user_prompt", "image_ids": ["F01"], "marker_id": "D01",
     "quantity": "distance", "value": 80, "unit": "mm", "status": "confirmed"}
  ]
}
```

This is a **draft contract**, not a functioning import format. Before implementation add file hash, immutable media asset identifiers, camera calibration, coordinate systems, measurement uncertainties and provenance/conflict schema; ensure uploaded files are validated, stored safely and never used as executable instructions.

## Geometric and metrological rules

- A known physical length calibrates a line/plane in the correct orientation; it does **not** automatically calibrate whole depth or curved 3D features.
- An ordinary ruler photographed at an angle is not a globally valid scale unless rectification or 3D calibration is performed.
- The visual pointer locates **which pixel/feature** is referenced, but cannot itself guarantee a 3D coordinate.
- Prefer at least three meaningful views with overlapping distinguishable physical features for 3D reconstruction; coverage and calibration still determine feasibility.
- Use independent units and source confidence; never call OCR guesses exact confirmed dimensions.
- Identify whether a dimension is a diameter, radius, wall thickness, center-to-center distance, edge clearance or total bounding length.
- Highlight uncalibrated photos and underconstrained depth instead of fabricating precise solids.
- If a measurement applies to more than one image, record each explicit image ID and cross-view feature association; avoid guesses from numeric filename suffixes.
- Preserve privacy of user-uploaded files and do not send them to cloud models unless explicit provider-specific permission is granted.

## UI fit

- **Left:** photo strip with `F01` ... `Fnn`, view name, scale status; compact prompt supporting marker insertion.
- **Center:** image overlay plus pointer/line/circle/plane tools; toggle between photo, vector sketch and reconstructed CAD projection. Preview association arrows should be hideable.
- **Right:** annotation list grouped by image or CAD feature, dimension and uncertainty fields, conflict warnings, constraints and feature/history link.
- **Bottom:** confirmation status `Captured → Calibrated → Referenced → Validated → CAD preview`; review errors are visible near the dimension and image.

The above remains future work until image input, annotation persistence, calibration and Core reconstruction are implemented and tested.
