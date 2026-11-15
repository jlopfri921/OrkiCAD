# Architecture decision records

This directory records consequential design choices.

## ADR-0001 — Shared core, dual interfaces

**Status:** Accepted — 2026-11-15

**Decision:** Share a Python CAD core between Tauri 2 / Rust / React Studio and a ComfyUI integration. Keep geometry deterministic and model engines behind adapters.

**Reason:** No duplicate part generation logic; Studio stays usable without ComfyUI.

## ADR-0002 — Replaceable AI providers

**Status:** Accepted — 2026-11-15

**Decision:** Local Ollama first; optional OpenAI, Anthropic Claude and Google Gemini adapters. Convert language into schema-validated parameters. Cloud sending must be explicit opt-in.

**Reason:** Users can choose performance, cost, privacy and offline operation independently.

## ADR-0003 — Incremental CAD engines

**Status:** Accepted — 2026-11-15

**Decision:** Introduce OpenSCAD/BOSL2 for initial parametric geometry, then CadQuery/FreeCAD for solid CAD and STEP. Advertise exports according to actual backend capabilities.

**Reason:** Avoid inaccurate promises that mesh and parametric CAD are interchangeable.
