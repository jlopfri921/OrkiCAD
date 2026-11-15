# Requirements & boundaries

## Functional goals

- Typed parameter schemas for mechanical components: washers, nuts, screws, gears, pulleys, brackets and enclosures.
- Unit handling (initially millimetres), defaults clearly labelled, parameter limits and validation.
- Deterministic geometry generation with versioned engine adapters.
- Text-to-CAD through explicit provider selection with schema-constrained output.
- Export formats supported per engine; previews, inspection and job reports.
- ComfyUI workflow adapter for OCR, vectorization and image-based 3D.
- Standalone desktop UI; optional browser-based UI and LAN API.

## Non-functional goals

- Windows-first development; Linux compatibility targeted where engines permit.
- Local-first operation and offline CAD without any AI provider.
- Reproducibility via pinned dependencies, sample files, tests and documented supported versions.
- Safety: no untrusted arbitrary code execution; subprocess isolation and path allowlists.
- Public documentation in English with Spanish guides to follow.

## Explicit non-goals for first milestone

- Production-certified threaded fasteners or aerospace tolerances.
- Fully automatic reverse-engineering of dimensioned drawings.
- Guaranteed watertight or dimensionally correct meshes from text-to-3D.
- Rendering every export format with every CAD backend.
- Automatic fabrication without human approval.

## Acceptance criteria for first working milestone

1. Validated schemas for four parts (washer, nut, screw, basic spur gear).
2. Deterministic geometry and mesh exports in at least one backend.
3. Invalid dimension combinations rejected with actionable errors.
4. A documented Windows setup and repeatable sample command.
5. Automated tests for dimensions, export files and regression examples.

## Multilingual product requirement (confirmed 2026-11-15)

- OrkiCAD Studio and future ComfyUI interface must support multiple UI languages from the architecture level.
- First implemented Studio languages: Spanish and English; browser-language detection and manual language switch.
- Keep CAD schema keys and units separate from translated UI strings; allow languages to be added without altering CAD core contracts.
- Future: translate server-side validation messages, technical enum choices, help/tutorials and documentation where feasible.
- See [Internationalization](I18N.md).

## Measurement-system requirement (confirmed 2026-11-15)

- The UI must offer explicit **Metric (mm)** and **Imperial (inches)** systems, independent of the selected interface language.
- Switching units must only change display/editing units: the CAD component, stored numbers and downloaded SCAD/STL must preserve real dimensions.
- All geometry-generation API contracts remain canonical **millimetres**, and no unit-dependent identifiers are sent to the backend.
- Angle `pressure_angle` remains in degrees; `teeth` is a count. Metric thread designations (M3–M12) and involute gear `module` remain metric standards, even in imperial display mode.
- STL is conventionally interpreted as millimetres for OrkiCAD designs; STL itself has no intrinsic unit metadata.
- Precision and UI number formatting are provisional; in future add unit-aware dimensional drawings, fractional-inch input and imperial hardware families without conflating UNC/UNF with metric threads.
