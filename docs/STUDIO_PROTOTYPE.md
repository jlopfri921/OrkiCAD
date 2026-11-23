# OrkiCAD Studio — First React prototype

**Status:** development-only React frontend connected to the shared Python core through a localhost API. It includes an STL 3D preview, feature-model operation history editing, and STL/3MF/STEP download actions. It is **not** a secured hosted web edition or a Tauri/Rust desktop installer. New functions are committed and require a fresh local integration test.

## Requirements

- OrkiCAD Python virtual environment already installed.
- Node.js and npm available on PATH.
- OpenSCAD/BOSL2 needed later for rendering mechanical SCAD files, not for the code-generation UI.

## Windows quick launch (new)

On an installed Windows development checkout, start both the Python CAD API and the Vite UI from the repository root:

```powershell
cd F:\orkicad-ai-github
.\Start-OrkiCAD-Web.ps1
```

Alternatively, double-click `Start-OrkiCAD-Web.cmd` in Explorer. The launcher opens the API and frontend in their own PowerShell windows, checks their local endpoints and opens `http://127.0.0.1:5173/` when both are ready. Already running compatible services are reused, not duplicated.

**First installation:** create `.venv`, install the Python project with `.\.venv\Scripts\python.exe -m pip install -e .`, then run `npm install` inside `studio/frontend`. The launcher does not install dependencies automatically, change security settings globally, or expose network ports beyond localhost. For errors, inspect the two separate PowerShell windows. Close those windows with Ctrl+C to stop services.

## Windows instructions — use two PowerShell windows

**Window 1: Python CAD core API**

```powershell
cd F:\orkicad-ai-github
git pull --ff-only origin main
.\.venv\Scripts\python.exe -m orkicad_core.studio_server
```

**Window 2: React frontend**

```powershell
cd F:\orkicad-ai-github\studio\frontend
npm install
npm run dev
```

Open http://127.0.0.1:5173, select a part, adjust parameters, and generate an STL. Choose **Feature model** to edit the ordered add/subtract operations. **Export 3MF** and **Export STEP (OCCT)** use the shared Python core through the development API: `/api/3mf` and `/api/step`, not a browser-side CAD executable. When the project-local `.venv-occt` contains OCP, the source prototype can discover it with the default `Auto` runtime setting. These are developer-mode conveniences; future production installers will bundle the CAD engine and expose no Python path field.

## Create vs. modify an existing CAD part (proposed Studio workflow)

The assistant has two explicit modes in the editor:

- **Create design**: interpret a new part description using the selected provider. The AI proposal replaces the unsaved design after review; saving it creates a separate local project rather than overwriting an earlier opened project.
- **Modify current design**: interpret the request relative to the currently selected **parametric part**. The request sends its validated specification to the selected provider (local Ollama by default; cloud providers only when selected explicitly). The model must return only a JSON `changes` object containing modified, allowlisted parameters. OrkiCAD validates the merged geometry and shows a **before → after** review; no changes apply until the user clicks **Apply changes**.

**Cancel** leaves the model unchanged. **Undo last AI edit** restores the parameters from immediately before the most recent accepted AI edit. The previous mesh is cleared only when changes are applied, then regenerated through the normal CAD workflow. Save the local project after applying changes; undo does not automatically rewrite an earlier saved snapshot.

This first version changes existing **part parameters only**. AI modifications to the `feature_model` operation tree, new booleans, changes of part family, importing topology, and undo history across sessions are out of scope. Use the manual inspector for operation-history modeling. The assistant does **not** keep conversational chat history; each modification includes current CAD parameters, not prior discussion turns.

**Privacy:** cloud AI edit requests include the design's dimensional specification as context and require the same per-request API credentials as creation; use Ollama for fully local edits.

**Manual E4 regression:** create and save a mounting plate 100 × 60 × 5 mm with 6 mm holes and 10 mm inset. Switch to **Modify current design**, ask to change only width to 120 mm and hole diameter to 8 mm. Confirm the review lists those two changes and the original solid is still displayed until Apply. Cancel once; retry and Apply. Check other dimensions unchanged, regenerated geometry correct, undo restores the original dimensions, and saving updates the local project. Test error handling for unsupported modifications and both themes.

## Boundaries and security

- Frontend is React + TypeScript + Vite.
- Python API uses the standard library, binding to 127.0.0.1:8765 only.
- API accepts JSON part parameters; it never executes arbitrary user code or opens file paths.
- Prototype has no authentication. The custom client header is not a password. Do not expose it to the LAN or Internet.
- Tauri/Rust packaging, production authentication, project persistence, secure cloud providers, multi-client viewport selection parity, and 3D slicing remain future milestones. Studio already has an STL preview and local Ollama proposal endpoint; their acceptance must be tested separately.
- Test on Windows and report defects before marking this Studio prototype verified.

## Troubleshooting: empty JSON / failed Generate SCAD

If Studio showed `Failed to execute 'json' on 'Response': Unexpected end of JSON input`, the frontend attempted to parse an empty response. A more informative frontend error was added in commit `fea6a5e`. This usually means the Python service was not started, stopped, or the Vite proxy could not reach port 8765.

1. Check http://127.0.0.1:8765/api/health in the browser. Expected: `{"status":"ok","service":"orkicad-studio-api"}`.
2. Keep `python -m orkicad_core.studio_server` running in one PowerShell window.
3. Keep `npm run dev` running in another PowerShell window.
4. Run `git pull --ff-only origin main` and refresh the Studio page after updating the frontend.
5. If health works but part generation still fails, inspect both terminal outputs and the browser Network tab for `POST /api/scad`, including HTTP status and response body.

To test API generation without the browser, run in a third PowerShell window:

```powershell
$body = @{type='washer';outer_diameter=18;inner_diameter=6.5;thickness=2} | ConvertTo-Json -Compress
Invoke-RestMethod -Uri 'http://127.0.0.1:8765/api/scad' -Method Post -ContentType 'application/json' -Headers @{'X-OrkiCAD-Client'='studio'} -Body $body
```

The `GET /api/health` and `POST /api/scad` endpoints test Python and OpenSCAD source generation only. STL export and mesh validation are separate operations.

## Shared three-client roadmap

Studio Web is **one of three required product interfaces**, alongside Studio Desktop and ComfyUI. The canonical Core, part catalog, `feature_model` JSON, validation and OCCT export logic are shared. Tauri Desktop will package the **same React app** rather than create a second editor. ComfyUI is an optional adapter that never gates Studio use.

**Current source-level progress (not yet runtime accepted):** Studio now has a dedicated React feature history editor with ordered add/cut operations; exports 3MF/STEP via the new development API endpoints; uses OCCT with optional automatic project-local runtime discovery; and has an automated React build / API smoke-test CI job. The visual operation schematic currently runs in ComfyUI; Studio Web/Desktop should share a packaged viewport component next. The previous Studio STL viewer displays a real mesh but has no direct topology/face selection.

The development HTTP server binds only to 127.0.0.1 and uses a non-secret client header. It is **not suitable for publishing to the Internet**. Hosted web deployment requires a hardened authenticated API, isolation, quotas, rate limiting, access controls, and protected file streaming.

For real desktop packaging, OrkiCAD must distribute a license-reviewed OCCT runtime, not ask a user to install FreeCAD, Python or ComfyUI, and not expose OS-dependent interpreter path fields. See [ADR 0007](adr/0007-three-clients-one-core.md).

## Testing the shared feature viewer and three-format CAD export

After installing the development dependencies, start the localhost Python API and Vite frontend as described above.

1. In Studio Web, choose **Feature model** from the catalog. The numbered feature cards now include an **interactive SVG axonometric schematic**. Select the first or last operation in the schematic; the corresponding card should highlight. Select a different operation card to update the schematic selection.
2. Modify one cut dimension, generate STL, and confirm the final real mesh in the separate STL viewer. The SVG schematic is intentionally *not* a substitute for actual CSG/mesh geometry.
3. Use **Export 3MF** and **Export STEP (OCCT)**. The backend automatically checks the current Python, a project-local `.venv-occt`, and prospective bundled runtime locations for native STEP. A source checkout still needs OCP installed, but users should not enter any engine path into Studio.
4. Run `python scripts/sync_shared_ui.py --check` to ensure the ComfyUI and Studio copies of the exact same framework-neutral feature viewer match `shared/ui/feature_viewport.js`. Use `python scripts/sync_shared_ui.py` after changing the canonical shared source.
5. Build the React frontend with `cd studio/frontend && npm install && npm run build`, and run `python -m unittest discover -s tests -v` from the installed Python Core environment.

**No Tauri installer is available yet.** The web prototype is local-only, not Internet-ready. The long-term desktop app must use the same React frontend and bundle native OCCT for one-click STEP without any Python/FreeCAD installation.

## Text-to-CAD in Spanish and optional cloud models (development prototype)

The Studio prompt editor accepts **Spanish or English** instructions. All AI provider adapters use the same English-language technical system instructions and require a **strict validated JSON CAD design**. The UI never requires users to translate prompts; stable schema names and millimetres are backend details.

The Studio UI provides three editable Spanish/English example prompts with **Use this example** and **Copy text** actions. Examples are selectable/copyable text, and the prompt textarea supports pasting and normal text editing. A **manual review checkbox** is displayed after AI proposes parameters: the user must approve the resulting form before SCAD/STL/3MF/STEP exports. Manual (non-AI) designs remain usable without this AI-only approval gate.

### Local model discovery

Select **Ollama**. Studio calls `GET /api/ollama/models`, which reads the local Ollama `/api/tags` endpoint through the backend and displays the installed model names. Users can also manually enter an existing model identifier. Ollama must be running on localhost; no internet or cloud API key is needed.

### Cloud providers — opt-in and not yet deployment-ready

Select **OpenAI API**, **Claude / Anthropic API**, or **Gemini API**, enter the exact model ID and the API key for that provider, and submit the prompt. The API key is sent to the local Python development server for the single provider request. The backend calls the fixed provider HTTPS endpoint, never logs or echoes keys intentionally, forbids redirects that could forward a key, validates the returned JSON with Core, and passes only validated part parameters back to the UI. The frontend clears the key after each attempt and does not use localStorage.

**Privacy/security:** Cloud requests send the CAD prompt to the selected external provider and may incur provider charges. The UI uses `password` inputs and shows a consent notice. These credentials must only be used on the loopback Studio developer server. The unauthenticated development API and temporary key mechanism are **not** safe for an Internet-facing deployment, multi-user hosting or production secure storage. Encrypted per-user secrets, authentication, authorization, network protections, request quotas and secure key storage are outstanding product tasks.

**Verification:** adapters, bilingual UI and mocked regression tests have been committed. Live API calls to commercial providers and the updated browser behavior have not yet been user accepted. Provider API model identifiers and access rights are determined by each user's provider account, not bundled with OrkiCAD.
