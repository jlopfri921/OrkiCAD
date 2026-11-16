# Versioning and release policy

- Target: Semantic Versioning (`MAJOR.MINOR.PATCH`).
- Until `v1.0.0`, public APIs and configuration may change between minor releases.
- `v0.0.0` indicates project foundation and planning, **not a runnable release**.
- Release only when code and reproducible tests support the advertised functionality.
- Each release must have a Git tag (`vX.Y.Z`), release notes, supported Windows/Linux and tool versions, migration notes and known limitations.
- Use feature branches and pull requests; document architecture choices as ADRs.
- Track implementation using GitHub Issues; close only after test evidence.
- Update `CHANGELOG.md`, `ROADMAP.md` and `docs/STATUS.md` together before any release.

## Development numbering decision — 2026-11-15

- Current Python package version: `0.0.1` (internal development prototype; **not** a Git-tagged release).
- The first proposed integrated prerelease is `0.1.0-alpha.1`, only after sufficient tests of Studio, data-driven CAD templates, optional Ollama interpretation and the ComfyUI bridge. This number is a **target**, not an already published release.
- Several commits, even across one or multiple days, can belong to the same `[Unreleased]` development cycle. **Do not increment version by calendar day or for each commit.**
- Increment the prerelease suffix (`alpha.2`, `alpha.3`) only when a new testable snapshot is intentionally tagged and released; use beta after integrations stabilize.
- Project release identifiers and package metadata should be synchronized at release time. For now, `CHANGELOG.md` entries remain under `[Unreleased]`.

## Canonical development version and identity — 2026-11-16

- **Official name:** OrkiCAD AI; desktop editor: OrkiCAD AI Studio.
- **Current development identifier:** `v0.0.1 · DEV`, not a public release. Display in Web and Desktop header/footer; Desktop window title: `OrkiCAD AI Studio`.
- Versions must match between `pyproject.toml`, `studio/frontend/package.json` and `studio/frontend/src-tauri/tauri.conf.json`.
- Update the `[Unreleased]` section of `CHANGELOG.md` with each substantial merged change and its test/acceptance status. Do not label an unmerged PR as released.
- Starting or building Studio runs `studio/frontend/scripts/check-version.mjs`; mismatches are errors, not warnings.
- Do not increment numbers for each commit. For a genuine tagged release, update all metadata, move shipped changes into a dated version heading, run CI/native build acceptance, and publish the tag and release notes.
