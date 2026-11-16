"""OrkiCAD AI native project v1: one editable parametric part, strict validation.

This *initial* document contract is the common source of truth for CAD 2D,
CAD 3D and Drawing views. It deliberately does not claim multi-part history,
sketch solving, STEP import or native B-rep face/feature persistence yet.
"""
from __future__ import annotations

import re
from collections.abc import Mapping

from .parts_catalog import validated_spec

PROJECT_SCHEMA = "orkicad.project/1"
_ID = re.compile(r"^[A-Za-z][A-Za-z0-9_-]{0,63}$")
_MAX_NAME = 100
_MAX_REVISION = 10**9


def validate_project_document(value: object) -> dict:
    """Return a canonical project JSON object or raise ValueError.

    Unknown top-level and part-level keys are rejected to avoid silently
    discarding geometry, source assets or future-schema information.
    """
    if not isinstance(value, dict):
        raise ValueError("OrkiCAD project must be a JSON object")
    expected = {"schema", "id", "name", "units", "origin_mm", "revision", "active_part_id", "parts"}
    extra = set(value) - expected
    missing = expected - set(value)
    if extra or missing:
        raise ValueError("Unknown or missing project fields: " + ", ".join(sorted(extra | missing)))
    if value["schema"] != PROJECT_SCHEMA:
        raise ValueError(f"Unsupported OrkiCAD project schema; expected {PROJECT_SCHEMA}")
    doc_id = value["id"]
    if not isinstance(doc_id, str) or not _ID.fullmatch(doc_id):
        raise ValueError("Project ID must be a stable ASCII identifier")
    name = value["name"]
    if not isinstance(name, str) or not (1 <= len(name.strip()) <= _MAX_NAME):
        raise ValueError("Project name must have 1..100 characters")
    if any(ord(ch) < 32 for ch in name):
        raise ValueError("Project name contains control characters")
    if value["units"] != "mm":
        raise ValueError("Core project units must be mm (inches are display-only)")
    if value["origin_mm"] != [0, 0, 0]:
        raise ValueError("This project schema requires absolute origin (0,0,0)")
    revision = value["revision"]
    if isinstance(revision, bool) or not isinstance(revision, int) or not 0 <= revision <= _MAX_REVISION:
        raise ValueError("Project revision must be a nonnegative integer")
    parts = value["parts"]
    if not isinstance(parts, list) or len(parts) != 1:
        raise ValueError("This development schema supports exactly one parametric part")
    part = parts[0]
    if not isinstance(part, dict) or set(part) != {"id", "type", "parameters"}:
        raise ValueError("Part needs exactly id, type, parameters")
    part_id = part["id"]
    if not isinstance(part_id, str) or not _ID.fullmatch(part_id):
        raise ValueError("Part ID must be a stable ASCII identifier")
    if value["active_part_id"] != part_id:
        raise ValueError("Active part ID must refer to the stored part")
    params = part["parameters"]
    if not isinstance(params, dict):
        raise ValueError("Part parameters must be an object")
    validated = validated_spec({"type": part["type"], **params})
    # Never silently discard extra parameters, even if the Core normally
    # tolerates unknown AI keys: native saved files must round-trip faithfully.
    if set(validated) != {"type", *params}:
        raise ValueError("Project contains unknown or incomplete part parameters")
    return {
        "schema": PROJECT_SCHEMA,
        "id": doc_id,
        "name": name.strip(),
        "units": "mm",
        "origin_mm": [0, 0, 0],
        "revision": revision,
        "active_part_id": part_id,
        "parts": [{"id": part_id, "type": validated.pop("type"), "parameters": validated}],
    }
