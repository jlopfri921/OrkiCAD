# OrkiCAD Core ↔ ComfyUI: first prototype integration

**Status:** code committed, not yet loaded or executed in the maintainer's ComfyUI Desktop installation. This is an early adapter, **not an officially released or certified ComfyUI plugin**.

## Design

OrkiCAD Studio and ComfyUI call the **same** `orkicad_core` functions to validate part specs and render geometry. There is no second CAD engine. ComfyUI nodes handle workflow inputs/outputs, not geometry generation.

This first iteration provides:

| Node ID | Inputs | Outputs | Behavior |
| --- | --- | --- | --- |
| `OrkiCADPartSpec` | Catalog part type, JSON overrides | JSON spec string | Merge allowlisted defaults with dimension overrides, validate |
| `OrkiCADGenerateSCAD` | JSON spec string | SCAD source string | Generate deterministic parameterized SCAD |
| `OrkiCADRenderSTL` | JSON spec string, safe filename stem | Absolute STL output path | Use the configured OpenSCAD runtime, save to ComfyUI output directory under `orkicad` |
| `OrkiCADInterpretLocal` | Natural language, Ollama model | JSON spec string | Local-only Ollama returns a **proposal** subject to review |

**Important:** parameter overrides are a JSON string in the first node. Fully dynamic ComfyUI input widgets require additional frontend work. Studio already consumes the live field catalog to display dynamic editing forms. The ComfyUI plugin offers a **native workflow path**, not yet an embedded editor.

## Windows installation (ComfyUI Desktop)

Use the Python interpreter from your ComfyUI environment, **not necessarily** the OrkiCAD `.venv`. Its location depends on the ComfyUI Desktop installation.

1. Update the repository at `F:\orkicad-ai-github`.
2. Install the shared package in the **ComfyUI Python environment** with `<comfy-python> -m pip install -e F:\orkicad-ai-github` (or configure `PYTHONPATH` appropriately). The version of `orkicad_core` imported by ComfyUI must match this repository.
3. Place a directory link in ComfyUI's **actual `custom_nodes` path** named `orkicad_nodes`, pointing to `F:\orkicad-ai-github\comfyui\orkicad_nodes`. Do not infer the custom_nodes location from the Desktop install directory; inspect ComfyUI's own configured paths.
4. Configure `ORKICAD_OPENSCAD` with the actual `openscad.exe` in `F:\OpenSCAD-2026`. For screws/gears, configure `ORKICAD_BOSL2_DIR` to `F:\orkicad-deps\BOSL2`. These variables must exist **in the ComfyUI process environment** before launch.
5. Restart ComfyUI fully and confirm the four `OrkiCAD` nodes appear in its node search.
6. Import `comfyui/workflows/orkicad_parametric_stl.json`, run the workflow and inspect the generated STL in the ComfyUI output directory under `orkicad`.

If ComfyUI Desktop maintains its own controlled Python/extension manager, use its package management UI to install `orkicad-core` and ensure it persists after updates. Avoid editing its bundled Python installation blindly.

## Smoke tests before loading ComfyUI

From the **OrkiCAD project** environment:

```powershell
cd F:\orkicad-ai-github
.\.venv\Scripts\python.exe -m unittest discover -s tests -v
```

From the selected **ComfyUI Python** environment verify:

```powershell
& "<comfy-python>" -c "from orkicad_core.parts_catalog import PARTS; print(list(PARTS))"
```

Run the JSON workflow in the ComfyUI UI. This file is authored for a standard LiteGraph workflow shape, but version-specific ComfyUI Desktop compatibility requires a real runtime test.

## Safety and known limitations

- `OrkiCADRenderSTL` does not accept arbitrary output paths. It writes inside the resolved ComfyUI output folder, with a generated suffix and strict filename stem.
- The first integration runs OpenSCAD synchronously. Larger jobs may block their workflow node until the subprocess finishes or times out.
- It does not upload input or output artifacts externally. The Ollama node sends a prompt only to a loopback HTTP endpoint configured in the Core.
- All CAD inputs are parsed through allowlisted, validated part schemas. AI-generated raw source is not executed.
- A bottle-cap model is **experimental**: printed mechanical fit and sealing are unverified.
- The ComfyUI node set has no direct STL preview widget, 3D scene editor or fractional-inch control in this iteration.
- Downloaded STL files have no inherent unit metadata; OrkiCAD uses millimetres as the mesh unit convention.

## Acceptance gates for 0.1.0-alpha.1

- [ ] All Python unit tests pass.
- [ ] All default catalog parts generate valid SCAD, new lids/caps produce inspected STL.
- [ ] ComfyUI starts without extension load errors.
- [ ] Each native node appears in the ComfyUI search.
- [ ] The example JSON workflow imports and runs with the target ComfyUI Desktop version.
- [ ] STL output is present, nonempty, watertight and dimensionally plausible.
- [ ] AI node is tested with an available local Ollama model and offline failure handling is confirmed.
- [ ] The Studio frontend builds successfully with the shared dynamic catalog.

## First local AI workflow: text → Ollama → parametric STL

A second importable example is now available:

`comfyui/workflows/orkicad_ollama_text_to_stl.json`

Pipeline: `OrkiCADInterpretLocal` → `OrkiCADGenerateSCAD` and `OrkiCADRenderSTL`.

**Preflight:** verify that Ollama is running locally and list available models with `ollama list` from Windows PowerShell. The sample workflow specifies `qwen3-coder:30b` as a *provisional example model*, **not a guarantee of installation**. Change the `ollama_model` widget to an exact locally installed model name before running. OrkiCAD's default endpoint is `http://127.0.0.1:11434`; other loopback-only endpoints can be supplied using the `ORKICAD_OLLAMA_URL` environment variable before starting ComfyUI.

Steps:
1. Update the OrkiCAD repository with `git pull --ff-only origin main`.
2. Restart ComfyUI Desktop completely, including any background backend still running.
3. Import `comfyui/workflows/orkicad_ollama_text_to_stl.json` into the workflow editor.
4. Set the `ollama_model` field to a locally available Ollama model from `ollama list`.
5. Read or modify the natural language prompt. The included example describes a rectangular fitted box lid with numerical dimensions.
6. Execute the workflow. If Ollama parses a supported part and its values pass the Core validator, OpenSCAD renders an STL under ComfyUI's `output/orkicad` directory.
7. Open the resulting STL in Studio or an external 3D viewer and inspect geometry, dimensions and mechanical fit assumptions. The workflow does **not yet provide an embedded ComfyUI STL preview**.

**Important prototype limitation:** this example connects the AI proposal directly to rendering, so running it implies acceptance of any valid **assumed default measurements**. This is suitable only for low-risk test prints. A separate explicit review/approval stage, labeled defaults, and a rich dynamic parameter editor are required before a production-ready release. Users should not treat this flow as a verified fit for bottle threads or load-bearing mechanical designs.

**Troubleshooting:**
- `Local Ollama unavailable`: Ollama is not running at the configured local endpoint; verify with `ollama list` or the local API and restart Ollama/ComfyUI as appropriate.
- `model not found` or HTTP 404: set the exact model tag shown by `ollama list`; there is no implicit remote model download.
- `unsupported CAD parameters`: the model output could not be validated against an existing registered part template. Ask for a supported part family and explicit measurements.
- No file visible in UI: this first node saves STL on disk and has no embedded visual preview.

## Troubleshooting: Ollama request timeout

The initial 75-second hardcoded request limit caused the maintainer's first AI workflow to fail with `Local Ollama unavailable: timed out`. The adapter now defaults to **180 seconds**, configurable with `ORKICAD_OLLAMA_TIMEOUT` (valid range 5–600 seconds). This change is committed but awaits rerunning the real ComfyUI workflow.

Before starting ComfyUI Desktop, verify that Ollama responds:

```powershell
ollama list
ollama ps
Invoke-RestMethod -Uri "http://127.0.0.1:11434/api/tags" -Method Get |
    Select-Object -ExpandProperty models | Select-Object name
```

Use the exact model name shown in the installed model list. Cold loading, CPU offloading and high memory demand can make large models slow. To pre-load a model, run `ollama run <installed-model>` in a different terminal, wait for a response, then exit the interactive chat. Set a longer timeout in the **ComfyUI launch process environment** if necessary:

```powershell
[Environment]::SetEnvironmentVariable("ORKICAD_OLLAMA_TIMEOUT", "240", "User")
```

Exit and restart **the entire ComfyUI Desktop launcher** for user environment changes to take effect. A connection timeout does not show whether the model is correctly installed, and the longer timeout is not a substitute for model and hardware diagnosis.

## Interactive STL preview in ComfyUI (experimental)

ComfyUI provides a native **Preview3D** node capable of displaying STL files in an interactive viewport. OrkiCAD now exposes **two** outputs from `OrkiCADRenderSTL`:

- `stl_path`: absolute file path for external use (unchanged first output).
- `preview_path`: output-relative path `orkicad/<generated-name>.stl` for the native ComfyUI viewer.

A new example is available at `comfyui/workflows/orkicad_ollama_review_preview_stl.json`, connecting:

`OrkiCADInterpretLocal → OrkiCADReviewSpec → OrkiCADRenderSTL → Preview3D`

The `Preview3D` node is built into supported ComfyUI versions, so this example does not bundle Three.js or install additional visualization packages. The workflow connects the **second** `RenderSTL` output to the preview node's `model_file` input. ComfyUI's current upstream code marks this simpler Preview3D entry as **deprecated** in favor of Preview3DAdvanced (which requires a typed 3D file), so this path remains experimental and subject to the installed Desktop build. If the node cannot be resolved, check whether **Preview 3D** is present and report the exact node type/version instead of installing unrelated extensions.

### Approval gate

`OrkiCADReviewSpec` requires `approve_for_export = true` and validates any `overrides_json` before passing the AI-produced part spec onward. The default is **false**: the first run raises a readable refusal with the proposed JSON parameters; **no STL is exported by this gate**. Read the dimensions in the error message, edit the `overrides_json` widget (e.g. `{"box_width":80,"box_depth":50}`), set `approve_for_export` true, and re-run. This is an interim manual safeguard, **not yet a complete interactive CAD parameter editor**.

### Maintainer check

```powershell
cd F:\orkicad-ai-github
git pull --ff-only origin main
.\.venv\Scripts\python.exe -m unittest discover -s tests -v
```

Restart ComfyUI Desktop completely (native node signatures changed), load the new workflow and verify the 3D preview with rotation/zoom. Native preview compatibility, viewer scaling, and new tests require the maintainer's on-device verification.
