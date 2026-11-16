"""Mechanical components backed by the external BOSL2 OpenSCAD library.

SCAD generation is deterministic and does not execute model-produced scripts.
Actual mesh generation requires OpenSCAD and a compatible BOSL2 checkout.
"""
from __future__ import annotations

from typing import Any, Mapping


# Tested against the BOSL2 API names documented in its wiki (2026-11-15).
# Geometry still requires verification with the chosen BOSL2 revision.
# Only BOSL2 screws.scad supported drives. Additional phN/tNN are
# explicit-size variants; the generic names retain legacy automatic sizing.
PHILLIPS_SIZES = ("ph0", "ph1", "ph2", "ph3", "ph4")
TORX_SIZES = ("t10", "t15", "t20", "t25", "t30", "t40")
HEAD_DRIVES = {
    "socket": {"hex", "torx", "t10", "t15", "t20", "t25", "t30", "t40"},
    "button": {"hex", "torx", "t10", "t15", "t20", "t25", "t30", "t40"},
    "hex": {"none"},
    "pan": {"slot", "phillips", "ph0", "ph1", "ph2", "ph3", "ph4", "torx", "t10", "t15", "t20", "t25", "t30", "t40"},
    "flat": {"hex", "torx", "t10", "t15", "t20", "t25", "t30", "t40", "slot", "phillips", "ph0", "ph1", "ph2", "ph3", "ph4"},
    "none": {"none", "hex", "torx", "t10", "t15", "t20", "t25", "t30", "t40", "slot"},
}

METRIC_DIAMETERS = (3, 4, 5, 6, 8, 10, 12)


def generate_mechanical_scad(spec: Mapping[str, Any]) -> str:
    from .geometry import ParameterError, _fmt, _number

    kind = spec.get("type")
    if kind in ("metric_screw", "metric_nut"):
        diameter = _number(spec, "diameter", high=12)
        if diameter not in METRIC_DIAMETERS:
            raise ParameterError(
                "diameter must be one of: M3, M4, M5, M6, M8, M10, M12"
            )
        pitch = spec.get("pitch")
        if pitch is None:
            thread_id = f"M{_fmt(diameter)}"
        else:
            pitch = _number(spec, "pitch", low=0.19, high=3)
            thread_id = f"M{_fmt(diameter)}x{_fmt(pitch)}"
        if kind == "metric_screw":
            length = _number(spec, "length", high=200)
            head = spec.get("head", "socket")
            drive = spec.get("drive", "hex" if head in ("socket", "button", "flat") else "none")
            if not isinstance(head, str) or head not in HEAD_DRIVES:
                raise ParameterError(f"invalid screw head: {head!r}")
            if not isinstance(drive, str) or drive not in HEAD_DRIVES[head]:
                raise ParameterError(f"head {head!r} does not support drive {drive!r}")
            result = (
                f'screw(spec="{thread_id}", length={_fmt(length)}, '
                f'head="{head}", drive="{drive}");\n'
            )
        else:
            shape = spec.get("shape", "hex")
            if shape not in ("hex", "square"):
                raise ParameterError("nut shape must be hex or square")
            thickness = spec.get("thickness", "normal")
            if isinstance(thickness, str):
                if thickness not in ("thin", "normal", "thick"):
                    raise ParameterError("nut thickness must be thin, normal, thick or a number")
                thickness_scad = f'"{thickness}"'
            else:
                thickness_scad = _fmt(_number(spec, "thickness", high=50))
            result = f'nut(spec="{thread_id}", shape="{shape}", thickness={thickness_scad});\n'
        return (
            "// OrkiCAD AI mechanical prototype. Units: mm. Requires BOSL2.\n"
            "include <BOSL2/std.scad>\n"
            "include <BOSL2/screws.scad>\n"
            + result
        )
    if kind == "spur_gear":
        module = _number(spec, "module", low=0.09, high=10)
        teeth = spec.get("teeth")
        if isinstance(teeth, bool) or not isinstance(teeth, int) or not 12 <= teeth <= 200:
            raise ParameterError("teeth must be an integer between 12 and 200")
        thickness = _number(spec, "thickness", high=100)
        shaft = _number(spec, "shaft_diameter", high=500)
        pressure = spec.get("pressure_angle", 20)
        if isinstance(pressure, bool) or not isinstance(pressure, (int, float)):
            raise ParameterError("pressure_angle must be 14.5, 20 or 25 degrees")
        if float(pressure) not in (14.5, 20, 25):
            raise ParameterError("pressure_angle must be 14.5, 20 or 25 degrees")
        if shaft >= module * (teeth - 2.5):
            raise ParameterError("shaft_diameter is too large for estimated tooth-root circle")
        return (
            "// OrkiCAD AI spur gear prototype. Units: mm. Requires BOSL2.\n"
            "include <BOSL2/std.scad>\n"
            "include <BOSL2/gears.scad>\n"
            f"spur_gear(mod={_fmt(module)}, teeth={teeth}, "
            f"thickness={_fmt(thickness)}, shaft_diam={_fmt(shaft)}, "
            f"pressure_angle={_fmt(float(pressure))});\n"
        )
    raise ParameterError("unsupported mechanical component type")
