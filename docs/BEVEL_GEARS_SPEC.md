# OrkiCAD IA — Parametric bevel gears technical specification

**Status:** DESIGN SPECIFICATION ONLY. No bevel-gear geometry, CAD export, or menu entry is implemented by this document.
**Target:** existing `core/orkicad_core` shared Python core, `studio/frontend` React UI, Tauri Desktop (same UI), optional ComfyUI adapter.
**Related:** `core/orkicad_core/parts_catalog.py`, `geometry.py`, `occt_worker.py`, `docs/ARCHITECTURE.md`.

## Product behavior

Under **Gears and transmission** (`transmission`), introduce **Bevel gears** (`bevel`) as a second-level category. The existing `spur_gear` must retain its schema, generator, and behavior.

Planned generator IDs (not yet registered in `PARTS`):
- `bevel_gear_straight` — straight-tooth bevel gear.
- `bevel_gear_spiral` — spiral bevel gear, left- or right-hand tooth orientation.
- `bevel_gear_zerol` — curved-tooth bevel gear with nominal zero spiral angle at the reference location; **not** merely a straight bevel gear renamed.
- `miter_gear_pair` — matched 1:1 pair with intersecting axes, including typical 90° intersection.

Future research: hypoid gears (offset nonintersecting axes), internal bevel gearing, crowning, tooth contact analysis and manufacturing-specific corrections. These must not be presented as implemented features.

## Schema principles

All lengths in canonical mm, angles in degrees. Display conversion is a UI concern. Define versioned per-type schemas in the Core, not duplicated geometry logic in TypeScript. AI results must pass the same Core validator before use. Reject unsupported tooth profiles/exports explicitly.

Example proposal for a **PAIR CONFIGURATION** (not a runnable current API input):

```json
{
  "schema_version": "1.0",
  "type": "miter_gear_pair",
  "category": "transmission",
  "subcategory": "bevel",
  "parameters": {
    "module": 2,
    "pinion_teeth": 20,
    "gear_teeth": 20,
    "shaft_angle": 90,
    "pressure_angle": 20,
    "face_width": 12,
    "bore_diameter_pinion": 8,
    "bore_diameter_gear": 8,
    "tooth_profile": "straight",
    "backlash": 0.1,
    "clearance": 0.2
  },
  "units": "mm",
  "origin": [0, 0, 0]
}
```

This envelope requires a compatibility adapter because the current OrkiCAD API accepts flat specs (`{"type": "...", "module": ...}`), not necessarily nested `parameters`. Existing flat schemas must continue working.

### Shared dimension fields

| Field | Type / units | Validation notes |
|---|---|---|
| `module` | positive mm | Module convention must be explicit (outer transverse module for straight bevel reference model). Do not silently equate normal and transverse modules for spiral types |
| `teeth` / `pinion_teeth`, `gear_teeth` | positive integers | Minimum based on tooth geometry, pressure angle and undercut/interference checks; **never assume a universal minimum 6** |
| `shaft_angle` | degrees, 0 < value < 180 | Angle between **intersecting** shaft axes; not a free viewing rotation |
| `pressure_angle` | degrees | Enumerated standard options initially, e.g. 20°, with validated allowable custom range |
| `face_width` | positive mm | Must be compatible with cone distance and inner-end tooth geometry; design-guideline warning when face width exceeds ~one third of outer cone distance, rather than a universal fabrication guarantee |
| `bore_diameter` | positive mm | Must fit within actual root/core and hub material at the smallest section |
| `hub_diameter`, `hub_length` | mm | Optional, validated against bore and gear body |
| `keyway_width`, `keyway_depth` | mm | Optional, validated to chosen keyway convention and wall |
| `backlash`, `clearance` | nonnegative mm | Use explicitly defined measurement locations and design conventions |
| `spiral_angle` | degrees | Only spiral/zerol cases; coupled to tooth curve geometry, not arbitrary mesh twisting |
| `handedness` | enum `left`/`right` | Relevant to spiral-type paired geometry |
| `gear_role` | enum `pinion`/`gear` | Paired design metadata |
| `tooth_profile` | enum `straight`/`spiral`/`zerol` | Enforce ID/profile consistency |
| `partner_teeth` | positive integer | Single part intended to mesh with matching partner; derive cone angles |
| `pair_mode` | boolean | Generate a single gear vs. compatible assembled pair when generator supports it |

Derived read-only data: pitch cone angles, cone distance, pitch diameters at defined reference section, ratio, mounting distance(s), min/max face section and contact/mesh feasibility warnings.

## Bevel pair geometry — initial straight-tooth foundation

For intersecting axes with shaft angle `Sigma`, tooth counts `z1` and `z2`, and common reference module convention, nominal pitch cone half angles:

`delta1 = atan2(z1 * sin(Sigma), z2 + z1 * cos(Sigma))`
`delta2 = Sigma - delta1`

The chosen branch must be appropriate for the validated geometry (including obtuse shaft angles), and degenerate configurations must be rejected. In the common 90° case, `tan(delta1) = z1/z2`. A 1:1 miter pair at 90° yields 45° pitch cone angles for both gears.

At the outer reference section, with the chosen transverse module `m`, `d_e1 = m*z1`, and the nominal outer cone distance for the pinion is `R_e = d_e1/(2*sin(delta1))`; the same distance should be recovered for the gear within numerical tolerance.

Tooth tips and roots cannot be approximated merely by subtracting equally spaced wedges from a cone and then described as involute engineering teeth. For the straight type, develop a defined approximate tooth system first, document its limitations, then validate against accepted bevel tooth-generation methods before claiming industrial tooth contact accuracy.

Spiral and Zerol gears require true spatial tooth flank construction (sweeps/lofts and suitable surface definition) and proper partner conjugacy. A visually twisted straight gear is **not** a valid implementation.

## CAD engine and export design

- Implement `core/orkicad_core/bevel_gears.py` with independent schema validation, derived dimensions and B-rep generation interfaces.
- Prefer **OCCT/OCP native B-rep** for STEP solids. Validate each Boolean/loft result, shape validity, solid count and bounds.
- Use OpenSCAD/BOSL2 only where a geometrically declared approximation is acceptable; clearly label it as such.
- Route `generate_scad` and OCCT `make_shape` through the shared core only when real generators exist; do not register nonfunctional pieces as available.
- Respect current `/api/catalog`, `/api/stl`, `/api/step`, `/api/3mf` contracts and report unsupported formats/engines rather than substituting fake geometry.
- For pairs, persist **two solids and their assembly transforms** in the shared assembly representation. Do not concatenate them as one fabricated solid.
- Keep the absolute origin and the XY/XZ/YZ datum planes consistent with Studio's existing controls. Gear local coordinate frames and mounting offsets should be explicit.

## Studio menu / searchable catalogs

Hierarchy:

```text
Engranajes y transmisión
  Engranajes cilíndricos
    Engranaje recto (current)
    Helicoidal / interior / cremallera (planned)
  Engranajes cónicos
    Cónico de dientes rectos (planned)
    Cónico espiral (planned)
    Cónico Zerol (planned)
    Par de ingletes (planned)
  Otros mecanismos
    Sinfín / corona / poleas / piñón de cadena (planned)
```

The actual current selector groups by `category`, not `subcategory`. Add optional `subcategory` (and localized labels/search aliases) to `catalog_public()` and use nested groups or searchable collapsible panes in Studio. Display only `implemented` generators by default. Planned entries may appear in a **separate disabled roadmap view**, never as selectable/exportable CAD parts. Preserve current search, category selection, active part and viewport layout. Keep parameter groups compact: Basic geometry, Cone & mounting, Tooth geometry, Bore & hub, Pair setup, Advanced manufacturing.

Search aliases in ES/EN should include: `cónico`, `conico`, `bevel`, `inglete`, `miter`, `espiral`, `spiral`, `zerol`, `dientes rectos`.

## Phased development and acceptance

1. **Compatibility gate**: latest circular plate regression and current shaft/tube/bracket tests, plus Studio TypeScript build; existing part exports must remain unchanged.
2. **Geometry math layer**: tested cone calculations, standardized module convention, pair ratios, derived read-only fields, warnings/errors and 90° miter reference samples.
3. **Straight bevel single part**: fully specified geometry and CAD export; verify tooth spacing, pitch cone, bore and analytical bounds, B-rep validity.
4. **Pair assembly**: two independent gear solids, proper intersecting-axis transforms, ratios and non-interpenetration checks under intended nominal placement.
5. **Spiral and Zerol**: separate flank construction and profile tests; do not mark available before true corresponding surfaces exist.
6. **UI and ComfyUI**: categorized, searchable, localized forms, parameter edits, dynamic preview, approval and export parity.

Recommended automated tests: schema rejects bool/NaN/Inf for numeric quantities, illegal integer tooth counts, cone degeneracy, incompatible pair ratios/profile/handedness, bore/core interference, excessive face widths; 90° miter returns 45°/45°, coordinate/angle conventions stable; OCCT produces valid bodies and STEP round-trip tests (when OCCT present); STL manifoldness/extents, UI dynamic category filtering and AI shape preservation.

**Definition of done:** A type is added to the live Core catalog only when its real geometry generator, validation, available export paths, sample part(s), and repeatable tests exist. Document fabrication limits. No automated meshing accuracy, conjugacy or manufactured fit is claimed absent numerical and physical validation.
