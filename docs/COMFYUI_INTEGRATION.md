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

## Visual parameter editor (experimental; pending Desktop acceptance test)

The `OrkiCADReviewSpec` node now includes an embedded DOM-based, catalog-driven parameter editor served from `comfyui/orkicad_nodes/web/parametric_editor.js`. The ComfyUI custom-node package exports `WEB_DIRECTORY = "./web"`. This editor is supported by an allowlisted metadata endpoint at `GET /orkicad/catalog` and requires no JavaScript build step.

Features in this initial implementation:

- Spanish/English text selector local to the review node.
- Millimetres/inches display toggle; all backend values remain canonical millimetres (25.4 mm/in).
- Number inputs with schema minima and integer treatment for tooth counts; select controls for categorical options.
- Each change updates the existing `overrides_json` widget without sending source code or custom geometry to the backend. Approval automatically resets to **false** whenever the edited values change.
- The AI node now returns both its original result and a ComfyUI `ui.proposed_spec` payload. The JavaScript extension uses it to populate the downstream review node automatically after the model runs.
- Existing workflows and backend approval rules remain in place. Run the AI once, review its parameters in the editor, set `approve_for_export = true`, then run again for STL output and 3D preview.

**Known limitations:** The first, unapproved run still fails deliberately at the Python review node. The browser-side editor is client-side and has not yet been validated in the maintainer's exact ComfyUI Desktop version. On some ComfyUI frontend releases the `addDOMWidget` API or link events may differ. Editing parameters after an approval resets the approval switch. A changed AI prompt is not yet bound to a server-side cryptographic approval of that exact proposal, so this is **not a safe approval control for critical designs**. The rendered preview updates on the next completed generation, not continuously while typing. A standalone native CAD application UI with richer geometry editing remains a separate roadmap target.

### Update and test on Windows

```powershell
cd F:\orkicad-ai-github
git pull --ff-only origin main
.\.venv\Scripts\python.exe -m unittest discover -s tests -v
```

Fully exit the ComfyUI Desktop launcher, restart it, reload the ComfyUI browser UI (Ctrl+Shift+R), then reimport `comfyui/workflows/orkicad_ollama_review_preview_stl.json`. Run once with `approve_for_export = false` to populate the visual review UI, then edit values using the form, toggle the same boolean approval field to true, and rerun.

If the form does not appear, verify that `GET http://127.0.0.1:<comfy-port>/orkicad/catalog` returns catalog metadata and inspect the browser developer-console errors and ComfyUI frontend version. Avoid assuming a fixed port: use the address shown by ComfyUI Desktop.

## Edit and regenerate without Ollama: standalone saved designs

**New nodes and sample workflow (experimental):**

- `OrkiCADSavedDesign` (display name **OrkiCAD · Saved parametric design**) has local `base_spec_json` and `overrides_json` widgets. It validates the stored design on every run and does not use, contact, or depend on Ollama.
- `comfyui/workflows/orkicad_saved_design_preview_stl.json` connects **Saved parametric design → Render STL → Preview3D**. The included self-contained lid is 80 × 50 mm with a 0.3 mm clearance and can be edited in the visual parameter form.
- The original review node's visual editor now has a **Copy design for AI-free edits** button. It copies the AI proposal plus current edited measurements into a standalone JSON specification.

**Workflow to transfer an AI-created part into the independent editor:**

1. Open and run the existing `orkicad_ollama_review_preview_stl.json` workflow once to obtain a supported CAD proposal.
2. In its `OrkiCADReviewSpec` visual form, adjust the dimensions if necessary, then click **Copy design for AI-free edits**. Browser clipboard permissions may require HTTPS or localhost; if clipboard is unavailable, copy the original and overridden JSON manually.
3. Open `orkicad_saved_design_preview_stl.json` as **a separate ComfyUI workflow**.
4. Paste the copied JSON into the `base_spec_json` widget of the `OrkiCADSavedDesign` node; leave `overrides_json` as `{}`, or set additional overrides.
5. Edit dimensions directly in its parameter editor and queue the workflow. Only the CAD Core and OpenSCAD are called. **Ollama is not part of this workflow and will not be invoked on subsequent CAD changes.**
6. Inspect the regenerated output in the native 3D preview. Editing values is not yet an instantaneous mesh update; it triggers an STL regeneration only when the workflow is queued.

All saved specifications are parsed through the central allowlisted catalog and geometric validator. This editor still supports the prototype's current eight part families, not freeform CAD geometry. The new saved-design workflow does not have a separate approval gate by default: selecting **Queue** is treated as the user's explicit instruction to regenerate a local draft STL. Check all tolerances before physical printing.

**Acceptance pending:** The Python regression tests and JavaScript controls have been updated in source but are not yet independently validated against the maintainer's Desktop installation. After `git pull --ff-only origin main`, run the project's unit tests and restart ComfyUI fully; use `Ctrl+Shift+R` to refresh the ComfyUI interface.

## Multi-format mesh export (source committed; runtime validation pending)

The OrkiCAD Core now provides `render_mesh(spec, format=...)` for allowlisted OpenSCAD output formats **STL, 3MF, OBJ, OFF and AMF**, retaining the original `render_stl` API for backwards compatibility. The ComfyUI `OrkiCADExportMesh` node exposes formats through a dropdown and saves exports with safe generated names under ComfyUI's `output/orkicad` directory.

Try the new example:

`comfyui/workflows/orkicad_saved_design_preview_export_3mf.json`

This links a self-contained saved design to both the original STL→Preview3D path **and** a 3MF exporter. It does not call Ollama. Change the format dropdown to OBJ/OFF/AMF/STL as required. The new node's Python and native OpenSCAD format compatibility **require a real Windows retest** after updating/restarting ComfyUI Desktop.

### Why STEP, IGES, and BREP require another backend

OpenSCAD emits tessellated meshes, not native boundary-representation (B-rep) CAD solids. Merely importing STL triangles and writing a STEP extension would store faceted surfaces, **not regain cylinders, analytic curves or editable design history**. For STEP/STP, IGES and native BREP, the planned OrkiCAD implementation is a **second, geometry-native FreeCAD/OpenCascade backend** that builds the part's analytic B-rep directly from the validated parameter specification and then exports STEP. FreeCAD provides `Part.TopoShape.exportStep`, `exportIges` and `exportBrep`; fully editable FreeCAD `.FCStd` documents additionally need a document/feature-tree design. The first implementation should support simple catalog families (washer, plate, box, lid), then tackle precise BOSL2-style threaded parts and gear construction separately. **STEP/IGES/BREP/FCStd export is not implemented in the current prototype and must not be presented in the UI as available.**

Exporting DXF, SVG or PDF from OpenSCAD is generally suitable for 2D projections/sketches rather than treating them as drop-in equivalents to a 3D solid.

## Combined Ollama → reviewed CAD → STL preview + 3MF workflow

**Workflow:** `comfyui/workflows/orkicad_ollama_review_preview_stl_3mf.json`

The entire AI-to-3MF path is available inside a **single ComfyUI workflow**:
`OrkiCADInterpretLocal` → `OrkiCADReviewSpec` → branches to `OrkiCADRenderSTL → Preview3D` **and** `OrkiCADExportMesh (3mf)`.

The two exports consume the **same validated, manually approved parametric specification**. The 3MF is generated directly by OpenSCAD from the approved geometry, **not by reinterpreting the AI instruction or converting a preexisting STL**. The ComfyUI output folder under `orkicad` contains separate `.stl` and `.3mf` files. Their geometry should be consistent, although format readers may handle mesh metadata differently.

After `git pull --ff-only origin main`, run the unit tests, restart ComfyUI Desktop and import the combined workflow. Confirm the installed model name in `OrkiCADInterpretLocal`. The review node defaults to `approve_for_export=false`: review or modify numerical values in the visual form, then switch approval to true and run. Both outputs only execute once approved. Verify the STL in Preview3D and inspect the resulting 3MF in a compatible slicer, checking actual dimensions.

**Status:** workflow committed and covered by an offline graph topology test. The new combined workflow has not yet been tested end-to-end in the maintainer's ComfyUI Desktop instance.

## Native analytic STEP export through FreeCADCmd — first implementation (not yet acceptance tested)

OrkiCAD now includes a **separate native B-rep engine** for STEP export, rather than wrapping an STL mesh. Implementation files:

- `core/orkicad_core/step_export.py` — validates the original parametric spec, invokes the separately installed `FreeCADCmd` in an isolated subprocess, checks exit status, marker, output presence and a 50 MiB limit.
- `core/orkicad_core/freecad_worker.py` — constructs Part solids using FreeCAD/OpenCascade geometry primitives and exports native STEP; no AI-supplied Python or source code is executed.
- `OrkiCADExportSTEP` ComfyUI node — reads the **same approved spec** as the STL and 3MF branches, writes `.step` under ComfyUI's `output/orkicad` directory.
- `comfyui/workflows/orkicad_ollama_review_preview_stl_3mf_step.json` — an integrated Ollama → visual editor/approval → **STL + Preview3D, 3MF, STEP** workflow.

**Current STEP-capable part types**: `washer`, `mounting_plate`, `open_box`, `box_lid`. Screw, nut, spur gear, and bottle cap are intentionally **not supported yet** by the analytic STEP backend; their existing STL/3MF exports remain available. The STEP prototype produces geometric solids, **not yet editable FreeCAD feature-history trees or FCStd documents**.

### Windows prerequisites

The FreeCAD application is an **optional external dependency**, separate from both OpenSCAD and the ComfyUI Python environment. Do not `pip install FreeCAD` into ComfyUI. Check for the headless executable (depending on your install directory):

```powershell
Get-Command FreeCADCmd.exe -ErrorAction SilentlyContinue
Get-ChildItem "C:\Program Files\FreeCAD*" -Filter FreeCADCmd.exe -File -Recurse -ErrorAction SilentlyContinue |
    Select-Object -First 10 FullName
```

After installing a compatible FreeCAD version, configure the **actual verified path**, for example by storing it in a user-scoped environment variable:

```powershell
$freecad = Get-ChildItem "C:\Program Files\FreeCAD*" -Filter FreeCADCmd.exe -File -Recurse -ErrorAction SilentlyContinue |
    Select-Object -First 1 -ExpandProperty FullName
if ($freecad) {
    [Environment]::SetEnvironmentVariable("ORKICAD_FREECAD_CMD", $freecad, "User")
    Write-Host "Configured:" $freecad
} else {
    Write-Warning "FreeCADCmd.exe not found; native STEP export will remain unavailable."
}
```

Then **fully restart** ComfyUI Desktop to inherit the new variable. The sample model is a supported `box_lid` by default. Update repository, run unit tests and restart ComfyUI before importing the new graph. Start with `approve_for_export=false`, review and adjust dimensions, approve and queue to produce the three artifacts. Open the STEP in FreeCAD and confirm that its shape is a valid solid and its dimensions match the STL/3MF.

**Known prototype limitations:** FreeCAD is not bundled; availability and CLI compatibility vary with Windows distributions. The exact scripted `FreeCADCmd` invocation and full integrated workflow are **not yet validated on the maintainer's PC**. OpenSCAD and FreeCAD construct the same simple catalog geometries independently, and tolerance parity needs a quantitative cross-backend comparison. The FreeCAD worker accepts only validated catalog parameters, and it checks solid validity at the end; this is not a claim of certified engineering fit. If FreeCAD is absent, the STEP branch will fail, so temporarily disable it to continue using STL/3MF.
