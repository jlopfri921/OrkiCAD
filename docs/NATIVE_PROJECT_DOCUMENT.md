# OrkiCAD AI — Native editable project format (first vertical slice)

**Status:** Implementation in PR #9, requires CI and desktop/Web user acceptance. Version remains `v0.0.1 · DEV`.

## Delivered scope

A project can be named, saved as `<name>.okad`, reopened in **Web and Tauri**, and revalidated against the authoritative Python CAD Core. The active parametric part and its fields are shared by CAD 2D / CAD 3D / technical drawing previews. The original 3D STL is **not** serialized and must be regenerated; this avoids treating stale triangle meshes as editable source geometry.

Sample file:

```json
{
  "schema": "orkicad.project/1",
  "id": "project_example",
  "name": "Placa circular",
  "units": "mm",
  "origin_mm": [0, 0, 0],
  "revision": 1,
  "active_part_id": "part_plate",
  "parts": [{
    "id": "part_plate",
    "type": "circular_plate",
    "parameters": {
      "outer_radius": 50, "thickness": 4,
      "hole_count": 5, "hole_diameter": 3,
      "bolt_circle_radius": 20
    }
  }]
}
```

Identifiers are persistent in files and preserved when saving an edited copy. The revision counter increments on a successful save. Imported files must have exactly the supported known fields; unexpected geometry, source assets or future schema versions are **rejected**, not discarded silently. The Python Core checks geometry using its regular part catalog.

`mm` is the canonical unit. The user may display inches, but the saved document's parameters always remain in mm.

## Current limitations

- v1 supports **one catalog-defined parametric part**, not a multi-solid assembly, external CAD document, imported STEP/STL mesh, custom 2D sketch or persistent operation history outside the existing `feature_model` parameter representation.
- The frontend keeps its current original design until validation succeeds. If a file fails validation, nothing is imported.
- No background autosave, cloud synchronization, hidden filesystem storage or project upload is performed. Only explicit user open/save actions are used.
- .okad is a simple editable JSON document; it must not be treated as executable script or file path input. A strict 16 KiB request limit applies in the existing local API.
- The current Web version uses its native file picker or browser download behavior. Desktop uses the existing Tauri native Save As dialog and a standard local file input for Open.
- Desktop remains a development snapshot: no bundled OpenSCAD/OCP runtime; section drawings are narrow nominal shapes, not B-rep drafting.

## Acceptance

1. Create a circular plate R50 with five Ø3 holes at R20, name the project, and save it as `.okad`.
2. Open the file in another client or after restarting; verify dimensions, part family, project name, persistent IDs and project revision.
3. Change the radius to 70 mm, save, reopen and verify the latest dimensions. Confirm the 3D mesh is regenerated rather than reusing a stale STL.
4. Remove a required property, use an unknown part type, add a source asset path or make holes impossible; loading must be refused without changing the current design.
5. Check bilingual controls, cancellation, long filenames, file-size limit and export behavior in Chrome and Tauri on Windows.

## Next iterations

The next schema revision can introduce versioned stable sketch IDs, source assets, local coordinate frames, part/assembly references, parametric features, associative dimensions, undo/redo and linked drawings only after their actual Core validation and tests exist. Introduce explicit migration rather than accepting unknown keys silently. This document is the foundation for photo reconstruction and inverse modeling, not their completed implementation.

## Native extension decision — 2026-11-16

The official project extension is **`.okad`** (e.g. `soporte.okad`). It remains versioned, UTF-8 JSON internally, not a STEP/STL container. **Legacy `.orkicad.json` project files remain readable** during the transition, but new saves use only `.okad`. Future changes to its internal structure must use explicit `schema` versioning and migrations; the filename extension alone does not indicate capability.
