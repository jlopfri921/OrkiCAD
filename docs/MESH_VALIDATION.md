# STL mesh validation (prototype)

The repo now contains a reusable CLI inspector built on Trimesh and NetworkX. These are optional dependencies. Do not install them into the ComfyUI virtual environment.

## Windows PowerShell

Run from the actual clone (currently F:\orkicad-ai-github):

```powershell
cd F:\orkicad-ai-github
git pull --ff-only origin main
.\.venv\Scripts\python.exe -m pip install -e '.[mesh]'
.\.venv\Scripts\python.exe -m orkicad_core.inspect_mesh outputs\gear_24T.stl outputs\nut_M6.stl outputs\screw_M6x30.stl outputs\washer.stl --json outputs\mesh-report.json
```

The JSON report is written to an ignored output directory.

## Interpretation

PASS requires positive finite volume, watertight geometry, one connected component, and strictly positive finite bounding dimensions. STL files do not inherently store millimetre unit metadata; units are inferred from OrkiCAD generation conventions.

PASS does not imply metrological accuracy, verified thread tolerances, suitable support settings, printability with a particular material, or compliance with industrial standards. Validate actual designs and test mechanical fits before manufacturing.

The command has source-level tests, but actual Windows execution of this new CLI must be independently confirmed.
