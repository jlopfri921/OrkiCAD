# OrkiCAD — branding and visual identity

## Product name and identity

- **Official name:** OrkiCAD (not OrkiCAD AI).
- **Product interface:** OrkiCAD Studio.
- **Tagline:** Design. Refine. Make.
- **Short description:** Open-source parametric CAD, powered by AI.
- **Repository:** [jlopfri921/OrkiCAD](https://github.com/jlopfri921/OrkiCAD).
- **Software license:** [Apache License 2.0](../LICENSE). Third-party assets and marks may carry their own terms.

## Current logo (legacy asset)

The repository currently contains [`logo_OrkiCAD-AI.png`](../logo_OrkiCAD-AI.png), shown in the README. **Its filename and artwork predate the OrkiCAD name decision.** Keep it unchanged until a new approved logo is available. Do not merely rename the PNG and claim that the visible wordmark has changed.

## Proposed design principles

- Minimal, usable CAD interface: large 3D viewport, clear controls, progressive disclosure.
- Consistent, accessible typography, spacing and iconography.
- Light and dark themes with documented contrast.
- Responsive layout; desktop first for editing, tablet/mobile for inspection and management.
- In-product brand text and titles use **OrkiCAD** / **OrkiCAD Studio** consistently.

These are design requirements, not claims that the new interface is already implemented.

## Asset checklist (not yet delivered)

- [ ] Approve a new `OrkiCAD` wordmark and standalone symbol.
- [ ] Publish verified light and dark logo variants.
- [ ] Produce an editable vector master and suitable PNG exports.
- [ ] Add browser favicon and platform app icons with correct sizes.
- [ ] Wire assets into React/Vite, Tauri and README.
- [ ] Test color contrast, readability at small sizes, and dark/light backgrounds.
- [ ] Review third-party font, icon and logo licensing before redistributing assets.

## Naming and backward compatibility

Technical identifiers, import paths and package names (for example `orkicad_core`, `orkicad-studio-frontend` and the Tauri bundle identifier) are **not** automatically renamed: compatibility and migration must be reviewed separately. Old URLs may redirect after the repository rename, but documentation should link to the canonical [OrkiCAD repository](https://github.com/jlopfri921/OrkiCAD).

## Third-party rights

The Apache 2.0 software license does not automatically grant rights over third-party brands, icons, fonts, model weights or external API services. Consult [third-party notices](../THIRD_PARTY_NOTICES.md).
