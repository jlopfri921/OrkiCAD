# Changelog

All notable changes will be recorded here, grouped by released version. The project uses a SemVer-inspired policy described in [docs/VERSIONING.md](docs/VERSIONING.md).

## [Unreleased]

### Added

- BOSL2-backed M3–M12 screw/nut and involute spur gear SCAD source generation, validated JSON examples and unit-test source.
- Optional CLI `--bosl2-dir` and Windows guide for external BOSL2 installation.


- First Python prototype: validated washer, mounting plate and open-box OpenSCAD generators, CLI, JSON examples, basic tests and GitHub Actions configuration.

- Initial project vision and planned architecture.
- Initial project scope, roadmap, versioning, security and contribution documentation.
- Planned local Ollama and optional OpenAI, Anthropic Claude and Google Gemini providers.

### Not released

- No downloadable production-ready CAD release, desktop application or ComfyUI workflow has been published yet. A prototype source generator is present.

### In progress — geometry tools and Studio

- Added an optional Trimesh/NetworkX mesh inspection command with machine-readable report and tests.
- Added an early React/TypeScript Studio part-parameter interface connected to a local Python CAD endpoint, with API tests.
- Recorded successful basic topological checks for four sample STL meshes from maintainer-provided Windows logs.
- **Unverified:** Studio frontend build, inspector command and end-to-end browser/API interaction on maintainer machine.
