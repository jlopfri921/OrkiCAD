"""FreeCAD-independent STEP export using an optional isolated OCCT/OCP runtime.

This is a second STEP backend and never converts STL triangles to STEP faces.
The main OrkiCAD/ComfyUI Python environment needs no additional packages.
"""
from __future__ import annotations

import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
from typing import Any, Mapping

from .parts_catalog import validated_spec
from .step_export import MAX_STEP_BYTES, STEP_SUPPORTED_TYPES

DEFAULT_TIMEOUT = 180


class OCCTExportError(RuntimeError):
    """OCCT could not create a native STEP solid."""


def resolve_occt_python(configured_path: str = "Auto") -> str:
    """Locate the optional OCCT runtime without machine-specific user paths.

    Auto priority: explicit environment override, bundled runtime, local
    development venv, and finally the active interpreter. A future desktop
    installer is responsible for bundling its own licensed OCCT runtime.
    """
    if not isinstance(configured_path, str):
        raise OCCTExportError("OCCT Python path must be a string")

    def executable(folder: Path) -> Path:
        if folder.is_file():
            return folder
        return folder / ("Scripts/python.exe" if os.name == "nt" else "bin/python")

    def check(candidate: Path) -> str | None:
        if candidate.is_file() and candidate.name.lower() in ("python", "python.exe"):
            return str(candidate.resolve())
        return None

    option = configured_path.strip().strip('"')
    if option and option.lower() != "auto":
        candidate = executable(Path(os.path.expandvars(option)).expanduser())
        found = check(candidate)
        if not found:
            raise OCCTExportError(f"Invalid OCCT Python runtime: {candidate}")
        return found

    configured = os.environ.get("ORKICAD_OCCT_PYTHON", "").strip().strip('"')
    if configured:
        candidate = executable(Path(os.path.expandvars(configured)).expanduser())
        found = check(candidate)
        if not found:
            raise OCCTExportError(f"ORKICAD_OCCT_PYTHON is invalid: {candidate}")
        return found

    # The Python package may reside in the source tree OR in a future
    # application bundle. Relative candidates support both without relying
    # on the developer's Windows drive or an absolute global install.
    here = Path(__file__).resolve()
    roots = (here.parents[2], here.parents[1], Path(sys.executable).resolve().parent)
    candidates = (
        Path("runtime/occt"),
        Path("runtimes/occt"),
        Path(".venv-occt"),
    )
    for root in roots:
        for child in candidates:
            found = check(executable(root / child))
            if found:
                return found
    return sys.executable

def render_occt_step(
    spec: Mapping[str, Any], *, python_path: str = "Auto", timeout: int = DEFAULT_TIMEOUT
) -> bytes:
    """Export validated parameters as analytic STEP, via a worker subprocess."""
    safe = validated_spec(spec)
    if safe["type"] not in (STEP_SUPPORTED_TYPES | {"feature_model"}):
        raise OCCTExportError(
            f"OCCT STEP not yet implemented for '{safe['type']}'. "
            "Supported: " + ", ".join(sorted(STEP_SUPPORTED_TYPES | {"feature_model"}))
        )
    if not isinstance(timeout, int) or not 5 <= timeout <= 600:
        raise ValueError("OCCT export timeout must be 5..600 seconds")
    executable = resolve_occt_python(python_path)
    worker = Path(__file__).with_name("occt_worker.py")
    if not worker.is_file():
        raise OCCTExportError("OrkiCAD native OCCT worker is missing")
    with tempfile.TemporaryDirectory(prefix="orkicad_occt_") as temp:
        source = Path(temp) / "design.json"
        destination = Path(temp) / "design.step"
        source.write_text(json.dumps(safe, ensure_ascii=False), encoding="utf-8")
        env = os.environ.copy()
        env["ORKICAD_OCCT_SPEC_PATH"] = str(source)
        env["ORKICAD_OCCT_OUT_PATH"] = str(destination)
        try:
            result = subprocess.run(
                [executable, str(worker)],
                cwd=temp,
                env=env,
                capture_output=True,
                text=True,
                encoding="utf-8",
                errors="replace",
                timeout=timeout,
                check=False,
            )
        except subprocess.TimeoutExpired as exc:
            raise OCCTExportError(f"OCCT export timed out after {timeout}s") from exc
        except OSError as exc:
            raise OCCTExportError(f"Could not start OCCT Python: {exc}") from exc
        log = ((result.stdout or "") + "\n" + (result.stderr or "")).strip()
        if result.returncode != 0 or "ORKICAD_OCCT_STEP_OK" not in log:
            if "No module named 'OCP'" in log or 'No module named "OCP"' in log:
                raise OCCTExportError(
                    "OrkiCAD OCCT runtime is unavailable. Desktop distributions "
                    "must include their own OCCT runtime; for source builds "
                    "install cadquery-ocp in the project .venv-occt environment."
                )
            raise OCCTExportError("OCCT STEP generation failed: " + log[-1800:])
        if not destination.is_file() or destination.stat().st_size == 0:
            raise OCCTExportError("OCCT worker returned success but STEP is missing")
        if destination.stat().st_size > MAX_STEP_BYTES:
            raise OCCTExportError("OCCT STEP exceeds 50 MiB prototype limit")
        data = destination.read_bytes()
        if not data.startswith(b"ISO-10303-21;"):
            raise OCCTExportError("Output does not have a STEP Part 21 header")
        return data
