# Roadmap

This roadmap describes **targets**, not delivered functionality. Milestones have no promised dates.

| Milestone | Target | Exit criteria |
| --- | --- | --- |
| v0.0.0 Foundation | Repository, decisions, security, scope | Docs in GitHub; no executable workflows claimed |
| v0.1.0 CAD core | Parameter schemas, deterministic primitive generators and CLI | Tests pass; sample parts export to STL/SCAD |
| v0.2.0 ComfyUI | Nodes with registered identifiers and workflow JSON | Workflows load and run on tested ComfyUI version |
| v0.3.0 Studio alpha | Tauri 2 / Rust / React UI, parameter forms and viewer | Windows dev build and end-to-end part export |
| v0.4.0 AI adapters | Ollama first, then OpenAI / Claude / Gemini | Structured validated output; local-only and opt-in cloud tests |
| v0.5.0 CAD interoperability | CadQuery/FreeCAD adapters, STEP, 2D DXF/SVG | Dimensional and output-format regression tests |
| v0.6.0 Visual AI | OCR/line vectorization and image-to-3D via ComfyUI | Demonstrated reproducible workflows |
| v1.0.0 Stable | Packaging, docs, security, release automation | Supported matrix, migration guide and test coverage |

## Near-term work packages

1. Define part schemas, units, dimensions, tolerances and geometry assertions.
2. Prototype OpenSCAD CLI adapter and explicit export capabilities.
3. Build example fasteners and gear generation using vetted CAD libraries.
4. Write geometry tests and test artifacts.
5. Add ComfyUI node registration and workflows against a real installation.
6. Introduce Studio frontend and provider adapters after CAD core is solid.

Progress belongs in [docs/STATUS.md](docs/STATUS.md). User-visible changes belong in [CHANGELOG.md](CHANGELOG.md).
