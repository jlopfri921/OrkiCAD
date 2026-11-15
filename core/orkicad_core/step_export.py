"""Native STEP export via a separate FreeCADCmd process.

Native B-rep topology is built from validated parametric CAD descriptions.
No tessellated STL-to-STEP conversion and no AI-authored source execution.
"""
from __future__ import annotations

import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
from typing import Any, Mapping

from .parts_catalog import validated_spec

STEP_SUPPORTED_TYPES = frozenset({"washer", "mounting_plate", "open_box", "box_lid"})
MAX_STEP_BYTES = 50 * 1024 * 1024
FREECAD_TIMEOUT = 180


class STEPExportError(RuntimeError):
    """Native B-rep export cannot be performed."""


def render_step(spec: Mapping[str, Any], *, timeout: int = FREECAD_TIMEOUT) -> bytes:
    """Build and return a STEP file using FreeCADCmd, or raise STEPExportError.

    FreeCAD is optional and must be installed independently from ComfyUI.
    Explicitly configure ORKICAD_FREECAD_CMD to the real FreeCADCmd.exe path
    if it is not present in PATH.
    """
    safe_spec = validated_spec(spec)
    kind = safe_spec["type"]
    if kind not in STEP_SUPPORTED_TYPES:
        raise STEPExportError(
            f"Native STEP support for '{kind}' is not yet implemented. "
            "Supported: " + ", ".join(sorted(STEP_SUPPORTED_TYPES))
        )
    executable = os.environ.get("ORKICAD_FREECAD_CMD", "FreeCADCmd")
    resolved = shutil.which(executable)
    if not resolved:
        raise STEPExportError(
            "FreeCADCmd was not found. Install FreeCAD and configure "
            "ORKICAD_FREECAD_CMD with the absolute path to FreeCADCmd.exe; "
            "then restart ComfyUI Desktop."
        )
    worker = Path(__file__).with_name("freecad_worker.py")
    if not worker.is_file():
        raise STEPExportError("OrkiCAD FreeCAD worker script is missing")
    if not isinstance(timeout, int) or not 5 <= timeout <= 600:
        raise ValueError("STEP timeout must be an integer between 5 and 600 seconds")
    with tempfile.TemporaryDirectory(prefix="orkicad_step_") as workspace:
        source = Path(workspace) / "design.json"
        target = Path(workspace) / "design.step"
        source.write_text(json.dumps(safe_spec, ensure_ascii=False), encoding="utf-8")
        environment = os.environ.copy()
        environment["ORKICAD_FC_SPEC_PATH"] = str(source)
        environment["ORKICAD_FC_OUT_PATH"] = str(target)
        try:
            result = subprocess.run(
                [resolved, str(worker)],
                env=environment,
                cwd=workspace,
                capture_output=True,
                text=True,
                encoding="utf-8",
                errors="replace",
                timeout=timeout,
                check=False,
            )
        except subprocess.TimeoutExpired as exc:
            raise STEPExportError(
                f"FreeCAD STEP export timed out after {timeout} seconds"
            ) from exc
        except OSError as exc:
            raise STEPExportError(f"Could not launch FreeCADCmd: {exc}") from exc
        output = ((result.stdout or "") + "\n" + (result.stderr or "")).strip()
        if result.returncode != 0 or "ORKICAD_STEP_EXPORT_OK" not in output:
            raise STEPExportError(
                "FreeCAD STEP generation failed: " + output[-1800:]
            )
        if not target.is_file() or target.stat().st_size == 0:
            raise STEPExportError("FreeCAD reported success but STEP output is missing")
        if target.stat().st_size > MAX_STEP_BYTES:
            raise STEPExportError("STEP output exceeded the 50 MiB prototype limit")
        return target.read_bytes()
