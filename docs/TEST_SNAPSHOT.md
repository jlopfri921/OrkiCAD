# OrkiCAD AI Studio v0.0.1 · DEV — Test instructions

**Status:** experimental test snapshot; no stable release or publicly deployed service. The original source is Apache-2.0; all third-party engine and logo conditions are separate.

## Getting the two downloadable artifacts

When the workflow **OrkiCAD AI - Web and Windows Tauri test snapshots** succeeds on this branch, open its successful GitHub Actions run and download:

- **OrkiCAD-AI-Web-v0.0.1-DEV** — compiled React/Vite static Web UI + the shared Python Core and a localhost-only web API runner. The downloaded artifact is a ZIP.
- **OrkiCAD-AI-Tauri-Windows-v0.0.1-DEV** — a Windows NSIS installer containing the React UI and a PyInstaller-bundled private Python Core worker. It does *not* include an OpenSCAD/BOSL2 or OCCT/OCP runtime.

No artifacts exist until the corresponding jobs have actually passed. A successful source commit is not an installer.

## Web without a Vite terminal

1. Download and extract the **Web** artifact to a local directory. Keep the folder structure: `core/`, `studio/web_runner.py`, `studio/frontend/dist/`, `Start-OrkiCAD-Web.ps1`.
2. Ensure a supported Python 3.10+ environment is available (Python 3.12 recommended). Windows PowerShell from that directory:

   ```powershell
   .\Start-OrkiCAD-Web.ps1
   ```

3. Open **http://127.0.0.1:8765/**. This is a local development Web preview, not a hosted website. There is no extra npm or Vite process once the files are compiled.
4. The `/api/health` endpoint must respond with JSON containing `"status":"ok"`. Stop PowerShell with Ctrl+C to shut down the API.

**Security:** port 8765 is bound to loopback only. Never forward/expose it to the Internet; this development backend has no user authentication for ordinary Web requests.

## Desktop without two manually launched servers

1. Download the **Tauri Windows** installer artifact only after CI succeeds; unzip the artifact if GitHub supplies it inside a ZIP.
2. Install and launch **OrkiCAD AI Studio**. Tauri starts a private token-protected Python Core worker on a random local port automatically. No Vite, Node.js, or separate `python -m orkicad_core.studio_server` process is needed.
3. **Geometry export dependencies (experimental snapshot):** the worker is included, but **OpenSCAD is not bundled**. Install a compatible local OpenSCAD separately; use PATH or the environment variable `ORKICAD_OPENSCAD` pointing to the executable. BOSL2 shapes additionally require a local `ORKICAD_BOSL2_DIR`. Native STEP requires a compatible OCCT/OCP runtime and is **not guaranteed to work in the packaged installer**. The UI may display options for unavailable engines; a clear error should be reported when used.
4. A Windows SmartScreen notice or antivirus scan may occur because this is an unsigned experimental installer. Confirm provenance and integrity on GitHub; do not bypass organizational security policies.

## Development from repository (no installer)

From checkout `F:\orkicad-ai-github`, after fetching the integration branch and installing dependencies:

```powershell
# Web: compile once and run the localhost API + static UI
cd F:\orkicad-ai-github
cd studio\frontend
npm install
npm run build
cd ..\..
.\Start-OrkiCAD-Web.ps1

# Desktop: in a separate session, close Web first, then:
cd F:\orkicad-ai-github
.\Start-OrkiCAD-Desktop.ps1
```

Alternatively the existing two-window Vite development mode remains supported: run the Python API on 8765 and `npm run dev` from `studio/frontend` on 5173.

## Acceptance checklist for testers

- Header uses the **OrkiCAD AI** name/logo and displays **v0.0.1 · DEV**; About dialog shows creator, engines, copyright, Apache-2.0 and separate third-party notices.
- Switch **ES/EN**: examples/tips, workspace titles and basic controls update language without changing dimensions.
- Switch **2D / 3D / Planimetry**: the same part remains selected, nominal SVG projections update when a supported shape's parameters change. These are not general OCCT-generated technical drawings yet.
- Circular plate R50, thickness 4, five Ø3 holes distributed at R20 should be a **disk**, not a square; change radius to R70 and verify fresh 3D preview, when OpenSCAD is available.
- Invalid hole position or a bore larger than the outside diameter must show a useful error or invalid preview. Previously rendered STL must be labeled stale and cannot be exported as if new.
- The 3D camera, reference planes XY/XZ/YZ, face selection on current STL and export controls should remain usable.
- Confirm that unsupported arbitrary section planes, DXF import, uploaded STEP/STL editing, multi-photo reconstruction and reverse engineering are **not misrepresented as working**. Their implementations remain in the future roadmap.

## Troubleshooting

- Web `ECONNREFUSED 127.0.0.1:8765`: the Python API was not started, or its port is in use.
- An OpenSCAD render failure is **not** a Web or Tauri connectivity failure. Check the installed OpenSCAD and BOSL2 paths.
- Desktop installer success with CAD worker failures: verify the installation includes `orkicad-runtime/orkicad-worker.exe` in app resources and review antivirus/process permissions.
- Report errors with the exact **app version, GitHub workflow run, Windows version, engine versions, selected part, parameters and messages**.
- This snapshot is not digitally signed, does not include an independently validated manufacturing tolerance workflow and must not be used as sole proof of fitness or safety.

## Release policy

Use `0.0.1 · DEV` until branch CI and device-specific tests succeed. The next `0.1.0-alpha.1` prerelease requires deliberate tagging and verified Core, Web, Desktop and declared ComfyUI workflows; do not label a CI artifact a stable production release.
