# ADR 0007: Three clients, one OrkiCAD product

**Status:** Accepted architectural requirement (2026-11-15). Delivery is incremental and not complete.

## Decision

OrkiCAD AI provides **three synchronized first-class clients**, with a single validated design model and one family of CAD engines/exporters:

1. **Studio Web**: React/TypeScript browser client; a secured server performs CAD and STEP operations. No native executable is exposed to the browser.
2. **Studio Desktop**: independently installable Windows, Linux and macOS app, targeted with Tauri 2 and the **same React UI** as Studio Web, backed by a bundled/managed local OrkiCAD worker and OCCT runtime.
3. **ComfyUI extension**: optional adapter for visual workflows, consuming the same Core schema and export capabilities. ComfyUI is never a Studio dependency.

Every feature should ship with compatible schemas, geometry validation, project serialization and export support across the three clients. Report incomplete implementation explicitly instead of claiming parity from a shared Python module alone.

## Architectural boundaries

```text
                  OrkiCAD canonical design JSON
                           │
                 versioned Core contract
                           │
              validation + CAD feature engine
                           │
      OpenSCAD mesh export / native OCCT B-rep STEP
               │             │             │
          Studio Web    Studio Desktop    ComfyUI
          React + API   React + Tauri     thin adapter
```

**Single editable project format:** the canonical `feature_model` JSON is portable across clients and stores ordered operations in millimetres. A future versioned project document will add stable feature IDs, labels, metadata and migration rules; the current JSON format does not have true feature-ID dependency references.

**Native CAD requirements:** STEP is produced from analytic B-reps via OCCT, never by renaming/re-wrapping triangles from STL. FreeCAD is not installed or required for STEP. The desktop distributable must include compatible, license-reviewed OCCT native libraries and managed worker; users must not configure Python interpreters or system folders. A clean-install smoke test without FreeCAD, a Python environment, or ComfyUI is a release gate.

**Web requirements:** native STEP is a server-side operation behind authenticated HTTPS, with request limits, per-user authorization, rate limiting, worker sandboxing, and controlled download handling. The current localhost development API is **not** Internet-safe and must not be publicly exposed. Hosted web and self-hosted web are possible deployment modes; neither silently executes OCCT in an ordinary browser.

**UI requirements:** editing, operation selection, metric/imperial display, AI review and 3D viewport capabilities belong to reusable UI modules. The present standalone `feature_viewport.js` is a framework-neutral operation schematic first delivered inside ComfyUI. It shows primitives, not the final CSG surface. React Studio integration and an eventual shared package/build step are necessary before claiming full UI parity.

## Incremental acceptance

- **Core parity**: run the same validated JSON through all client adapters; compare geometry, bounds, units and export outputs.
- **Web**: interactive project editor, STL/3MF/STEP endpoints, secure server configuration, real browser acceptance.
- **Desktop**: same React editor with Tauri shell, bundled OCCT/OpenSCAD runtime, clean installation on Windows/Linux/macOS without manual paths; signed/notarized releases when applicable.
- **ComfyUI**: lightweight integration, no mandatory FreeCAD, no manual engine paths in production; optional advanced override for developers only.
- **Compatibility**: shared regression fixtures must load, edit and export equivalently; each new feature documents its acceptance evidence by client.

## Current evidence boundary

Windows ComfyUI feature modeling and exports were reported working by the maintainer. The standalone desktop binary and deployed secure web app **do not yet exist**. Auto-detection of a development OCCT environment is only a transitional convenience; it is not equivalent to shipping a bundled runtime or satisfying one-click install.
