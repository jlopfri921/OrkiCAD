# BOSL2 parametric fasteners and gears — Windows setup

**Status:** prototype source code committed, real OpenSCAD rendering and geometry verification on the developer's machine **pending**.

OrkiCAD uses the upstream BOSL2 OpenSCAD library (not bundled in this repository).

- Official repository: https://github.com/BelfrySCAD/BOSL2
- Screw and nut API: https://github.com/BelfrySCAD/BOSL2/wiki/screws.scad
- Involute spur gear API: https://github.com/BelfrySCAD/BOSL2/wiki/gears.scad

Review BOSL2's license, pin a commit in a future dependency manifest, and maintain upstream attribution before redistributing any dependency.

## Set up in PowerShell

Run in your **actual Git checkout**. If your checkout is still `F:\orkicad-ai-github`, use:

```powershell
Set-Location 'F:\orkicad-ai-github'
git pull --ff-only origin main
# Keep third-party code outside the tracked project:
New-Item -ItemType Directory -Force -Path 'F:\orkicad-deps' | Out-Null
git clone https://github.com/BelfrySCAD/BOSL2.git 'F:\orkicad-deps\BOSL2'
Test-Path 'F:\orkicad-deps\BOSL2\screws.scad'
Test-Path 'F:\orkicad-deps\BOSL2\gears.scad'
```

If BOSL2 was already cloned, use `git -C 'F:\orkicad-deps\BOSL2' status` before updating it; do not overwrite local modifications.

## Generate SCAD files (Python only)

```powershell
.\.venv\Scripts\python.exe -m unittest discover -s tests -v
.\.venv\Scripts\python.exe -m orkicad_core.cli examples\screw_M6x30.json -o outputs\screw_M6x30.scad
.\.venv\Scripts\python.exe -m orkicad_core.cli examples\nut_M6.json -o outputs\nut_M6.scad
.\.venv\Scripts\python.exe -m orkicad_core.cli examples\gear_24T.json -o outputs\gear_24T.scad
```

## Export STL (requires external OpenSCAD + BOSL2)

```powershell
$openscad = 'C:\Program Files\OpenSCAD\openscad.exe'
$bosl2 = 'F:\orkicad-deps\BOSL2'
Test-Path $openscad
Test-Path (Join-Path $bosl2 'std.scad')
.\.venv\Scripts\python.exe -m orkicad_core.cli examples\screw_M6x30.json -o outputs\screw_M6x30.stl --openscad $openscad --bosl2-dir $bosl2
.\.venv\Scripts\python.exe -m orkicad_core.cli examples\nut_M6.json -o outputs\nut_M6.stl --openscad $openscad --bosl2-dir $bosl2
.\.venv\Scripts\python.exe -m orkicad_core.cli examples\gear_24T.json -o outputs\gear_24T.stl --openscad $openscad --bosl2-dir $bosl2
Get-ChildItem outputs\*.stl | Select-Object Name,Length
```

To **open SCAD manually** in OpenSCAD, in the same PowerShell session set `$env:OPENSCADPATH = 'F:\orkicad-deps'` first, then launch the editor. Or install BOSL2 into OpenSCAD's standard library directory. The CLI `--bosl2-dir` option only configures the export subprocess.

## Supported JSON (prototype)

- **metric_screw:** `diameter` one of 3,4,5,6,8,10,12; `length` (mm); optional `pitch`; `head` and compatible `drive`. E.g. M6 × 1 × 30, socket head with hex recess.
- **metric_nut:** diameter/pitch, `shape` `hex` or `square`, `thickness` `thin`, `normal`, `thick` or numeric mm.
- **spur_gear:** `module`, integer `teeth` (12–200), `thickness`, `shaft_diameter`, optional `pressure_angle` (14.5, 20, 25).

Diameter/fit validation is **preliminary**. A model that renders does not prove ISO/production compliance or acceptable 3D printed thread fit. Confirm size, watertightness and tolerance on the actual machine. Test small print samples before mating threaded components.

## Troubleshooting

- Missing `BOSL2/std.scad`: check `--bosl2-dir` points to the **BOSL2 folder**, not its parent.
- OpenSCAD missing: find the installed `openscad.exe` path and update `$openscad`.
- Rendering takes time: BOSL2 threads and involute gears may be expensive to mesh.
- A `.scad` output only means text generation succeeded; STL rendering must be separately confirmed.
