# OrkiCAD AI — Software license decision: Apache License 2.0

**Decision 2026-11-16:** The original source code of **OrkiCAD AI** is licensed under the **Apache License, Version 2.0** (SPDX `Apache-2.0`). The unmodified standard legal text is committed as the repository root [LICENSE](../LICENSE); [NOTICE](../NOTICE) records attribution.

## Why this license

- Broad educational, research, commercial and personal use and redistribution are possible under Apache-2.0's conditions.
- Explicit patent license and preservation of notices.
- A permissive framework helps interoperability and separately developed ComfyUI nodes.
- This **does not** impose a duty to publish third-party improvements or provide the source of unrelated derivative programs. If a reciprocal requirement becomes essential, changing the license of contributed or already distributed code requires separate legal analysis and appropriate rights.

## Scope and exclusions

The Apache-2.0 grant covers original source code copyrightable by OrkiCAD AI's authors, subject to known third-party rights; it does **not** relicense OCCT, OpenSCAD, BOSL2, FreeCAD, Tauri, ComfyUI, AI models, photographs, imported CAD data or external dependencies.

- **OCCT** is licensed under LGPL-2.1 with an OCCT exception; comply with all applicable attribution, linking and delivery obligations when redistributing.
- **OpenSCAD** is GPL-licensed software. Review exact integration, source, binaries and packaging before bundling; a standalone CLI used as a separate process has different compliance considerations from copying/linking GPL code.
- Each **BOSL2, FreeCAD, ComfyUI, frontend, Python, AI runtime and weight** dependency must be audited against the exact version and usage pattern.
- The official **OrkiCAD AI** name and logo remain subject to separate branding rights. Apache-2.0 does not grant trademark rights; see [BRANDING.md](BRANDING.md).

## Before distributing installers

1. Audit shipped source and dependencies, actual license versions, copyright holders, model terms and modifications.
2. Check that imported/copied sources have appropriate permission and contributor agreements are clear.
3. Include the license/NOTICE and upstream obligations with downloadable packages. Provide source/relinkability where applicable.
4. Review packaging of OCCT, OpenSCAD and optional FreeCAD adapters with qualified legal counsel.
5. Release a tested, versioned and tagged package only after the above is complete.

## Sources

- https://www.apache.org/licenses/LICENSE-2.0
- https://choosealicense.com/licenses/apache-2.0/
- https://occt3d.com/dev/doc/overview/html/
- https://github.com/Open-Cascade-SAS/OCCT
