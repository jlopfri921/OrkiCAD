# OrkiCAD AI — Software license decision (pending)

**Project status: no `LICENSE` file has been adopted or published as of 2026-11-16.** This document is a recommendation, not a grant of rights or a change to licensing. The author must explicitly choose the license and approve the corresponding standard legal text.

## Recommendation for current development: Apache License 2.0

For a modular CAD engine, a Web/Desktop application and a deliberately limited ComfyUI node integration, **Apache-2.0** is a pragmatic default if the author's priority is broad adoption and contributions, research/education use, commercial compatibility, and keeping the *OrkiCAD AI* brand distinct from source-code permission.

- Permits usage, modification, redistribution and commercial projects subject to copyright/license notices and marking modified files.
- Includes an express patent license provision and no trademark license.
- Does **not** require downstream users to disclose modifications. If ensuring downstream improvements remain public is a primary goal, consider **GPL-3.0-or-later** for the application and Core instead; that choice needs a deliberate review of imported and linked dependencies, plugin expectations and distribution plans.
- If the central goal is to require source distribution from modified network-hosted services, **AGPL-3.0-or-later** is an alternative, but it imposes stronger obligations and complicates broad third-party integration. This is not an automatic recommendation for a pluggable CAD ecosystem.
- MIT is simpler but lacks Apache-2.0's express patent provision and substantial legal specificity.

## Dependencies are independently licensed

The choice of license for OrkiCAD AI **does not relicense** OCCT, OpenSCAD, BOSL2, FreeCAD, React/Tauri, AI models or ComfyUI.

- **Open CASCADE Technology (OCCT)**: LGPL-2.1 with an additional OCCT exception, including required attribution/user-rights notices and distribution compliance. Review the precise packaging and linking arrangement before distributing an installer.
- **OpenSCAD**: GPL-licensed software. Running an external standalone program is not automatically the same legal situation as incorporating/copying linked GPL code. Verify actual distribution arrangements and bundled components with qualified counsel.
- **BOSL2 / FreeCAD / ComfyUI and other dependencies**: audit exact versions, copyright and SPDX terms before bundling or copying any code. Some AI models have usage restrictions separate from software licenses.
- Keep `THIRD_PARTY_NOTICES.md` as the bill of materials/licenses/attributions for what is truly shipped.

## Logo and marks

Source code licensing does not automatically authorize use of *OrkiCAD AI* as a trademark or the official logo in derivative-product branding. The project should explicitly describe its logo policy. A trademark registration or separate logo-artwork license is a separate decision and is not supplied by Apache-2.0.

## Decision checklist for the author

1. Confirm whether **permissive open source** or **reciprocal copyleft** is the desired long-term strategy.
2. Audit provenance, contributor copyright assignments/CLAs or developer certificate of origin and third-party code.
3. Choose exact SPDX identifier, year, copyright holder(s) and insert the **unaltered official license text** in repository root `LICENSE`.
4. Update `pyproject.toml`, README, About dialog, repository license metadata and changelog.
5. Have a legal professional assess any commercially distributed bundles of OCCT/OpenSCAD/FreeCAD and downloadable AI models.
6. Only then publish a release and state that the source is distributed under the selected license.

## Sources

- Apache-2.0: https://www.apache.org/licenses/LICENSE-2.0
- Choose a License overview: https://choosealicense.com/licenses/apache-2.0/
- OCCT licensing documentation: https://occt3d.com/dev/doc/overview/html/occt_public_license.html
- Official OCCT source and exception: https://github.com/Open-Cascade-SAS/OCCT
