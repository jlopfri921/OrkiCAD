"""Validated parametric parts exported as OpenSCAD source.

No external Python dependencies. Requires OpenSCAD separately for STL export.
Dimensions are millimetres. These are simple prototype solids, not standard-
certified hardware or toleranced manufacturing drawings.
"""
from __future__ import annotations

import math
from typing import Any, Mapping


class ParameterError(ValueError):
    """Invalid or inconsistent geometry parameters."""


def _number(data: Mapping[str, Any], key: str, *, low: float = 0.0,
            high: float = 10000.0) -> float:
    value = data.get(key)
    if isinstance(value, bool) or not isinstance(value, (float, int)):
        raise ParameterError(f"{key} must be a number (millimetres)")
    num = float(value)
    if not math.isfinite(num) or num <= low or num > high:
        raise ParameterError(f"{key} must be > {low} and <= {high}")
    return num


def _fmt(value: float) -> str:
    return format(value, ".10g")


def generate_scad(spec: Mapping[str, Any]) -> str:
    """Return deterministic OpenSCAD code from explicitly allowed parameters.

    Supported types: washer, mounting_plate and open_box.
    Does not accept arbitrary Python, shell commands or SCAD source from AI.
    """
    if not isinstance(spec, Mapping):
        raise ParameterError("spec must be an object")
    kind = spec.get("type")
    if kind == "washer":
        outer = _number(spec, "outer_diameter")
        inner = _number(spec, "inner_diameter")
        height = _number(spec, "thickness")
        if inner >= outer:
            raise ParameterError("inner_diameter must be smaller than outer_diameter")
        result = (
            f"difference() {{\n"
            f"  cylinder(h={_fmt(height)}, d={_fmt(outer)}, $fn=128);\n"
            f"  translate([0,0,-0.1]) cylinder(h={_fmt(height + 0.2)}, d={_fmt(inner)}, $fn=128);\n"
            f"}}\n"
        )
    elif kind == "mounting_plate":
        width = _number(spec, "width")
        depth = _number(spec, "depth")
        thickness = _number(spec, "thickness")
        hole = _number(spec, "hole_diameter")
        inset = _number(spec, "hole_inset")
        if 2 * inset + hole > min(width, depth):
            raise ParameterError("holes must fit within plate boundaries")
        if inset <= hole / 2:
            raise ParameterError("hole_inset must exceed hole radius")
        positions = [(x, y) for x in (inset, width - inset)
                     for y in (inset, depth - inset)]
        cutters = "\n".join(
            f"  translate([{_fmt(x)},{_fmt(y)},-0.1]) cylinder(h={_fmt(thickness + 0.2)}, d={_fmt(hole)}, $fn=64);"
            for x, y in positions
        )
        result = (
            "difference() {\n"
            f"  cube([{_fmt(width)},{_fmt(depth)},{_fmt(thickness)}]);\n"
            f"{cutters}\n"
            "}\n"
        )
    elif kind == "open_box":
        width = _number(spec, "width")
        depth = _number(spec, "depth")
        height = _number(spec, "height")
        wall = _number(spec, "wall")
        if 2 * wall >= min(width, depth) or wall >= height:
            raise ParameterError("wall too thick for dimensions")
        result = (
            "difference() {\n"
            f"  cube([{_fmt(width)},{_fmt(depth)},{_fmt(height)}]);\n"
            f"  translate([{_fmt(wall)},{_fmt(wall)},{_fmt(wall)}]) "
            f"cube([{_fmt(width-2*wall)},{_fmt(depth-2*wall)},{_fmt(height)}]);\n"
            "}\n"
        )
    else:
        raise ParameterError(
            "type must be one of: washer, mounting_plate, open_box"
        )
    return "// OrkiCAD AI prototype. Units: mm.\n" + result
