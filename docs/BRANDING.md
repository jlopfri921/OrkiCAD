# OrkiCAD — branding and visual identity

## Product name and identity

- **Official name:** OrkiCAD (not OrkiCAD AI).
- **Product interface:** OrkiCAD Studio.
- **Tagline:** Design. Refine. Make.
- **Short description:** Open-source parametric CAD, powered by AI.
- **Repository:** [jlopfri921/OrkiCAD](https://github.com/jlopfri921/OrkiCAD).
- **Software license:** [Apache License 2.0](../LICENSE). Third-party assets and marks may carry their own terms.

## Approved SVG identity assets (first iteration)

- [Light-background wordmark](../assets/branding/orkicad-logo-light.svg)
- [Dark-background wordmark](../assets/branding/orkicad-logo-dark.svg)
- [App-icon vector source](../assets/branding/orkicad-icon.svg)
- [Studio browser favicon](../studio/frontend/public/favicon.svg)

These are first-pass vector recreations of the approved visual concept, not a vector extraction of the image-generation mockup. The original `logo_OrkiCAD-AI.png` remains in place for compatibility; the README now uses responsive light/dark OrkiCAD wordmarks.

## Proposed design principles

- Minimal, usable CAD interface: large 3D viewport, clear controls, progressive disclosure.
- Consistent, accessible typography, spacing and iconography.
- Light and dark themes with documented contrast.
- Responsive layout; desktop first for editing, tablet/mobile for inspection and management.
- In-product brand text and titles use **OrkiCAD** / **OrkiCAD Studio** consistently.

These are design requirements, not claims that the new interface is already implemented.

## Asset checklist (not yet delivered)

- [x] Add new `OrkiCAD` SVG wordmark and standalone symbol for design review.
- [x] Publish initial light and dark SVG wordmark variants (visual review pending).
- [x] Produce editable SVG assets; production raster exports still pending.
- [x] Add a Studio SVG favicon; Tauri raster icons (ICO/ICNS/PNG sizes) still pending.
- [x] Wire favicon into Vite and wordmark into README; Tauri bundle wiring pending.
- [ ] Test color contrast, readability at small sizes, and dark/light backgrounds.
- [ ] Review third-party font, icon and logo licensing before redistributing assets.

## Naming and backward compatibility

Technical identifiers, import paths and package names (for example `orkicad_core`, `orkicad-studio-frontend` and the Tauri bundle identifier) are **not** automatically renamed: compatibility and migration must be reviewed separately. Old URLs may redirect after the repository rename, but documentation should link to the canonical [OrkiCAD repository](https://github.com/jlopfri921/OrkiCAD).

## Third-party rights

The Apache 2.0 software license does not automatically grant rights over third-party brands, icons, fonts, model weights or external API services. Consult [third-party notices](../THIRD_PARTY_NOTICES.md).
