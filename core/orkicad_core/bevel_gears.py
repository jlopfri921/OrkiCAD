"""Deterministic BOSL2 straight-bevel gear source and pitch-cone validation.

The generated tooth surface is delegated to a pinned/verified BOSL2 installation.
This is not yet an OCCT STEP implementation or manufacturing certification.
"""
from __future__ import annotations

import math
from typing import Any, Mapping


def straight_bevel_dimensions(spec: Mapping[str, Any]) -> dict[str, float]:
    """Compute nominal outer pitch-cone geometry for intersecting shaft axes."""
    from .geometry import ParameterError, _number

    module = _number(spec, "module", low=0.09, high=20)
    teeth = spec.get("teeth")
    mate = spec.get("mate_teeth")
    for field, value in (("teeth", teeth), ("mate_teeth", mate)):
        if isinstance(value, bool) or not isinstance(value, int) or not 12 <= value <= 200:
            raise ParameterError(f"{field} must be an integer between 12 and 200")
    angle = _number(spec, "shaft_angle", low=0, high=179.9)
    if angle < 10:
        raise ParameterError("shaft_angle must be between 10 and 179.9 degrees")
    pressure = spec.get("pressure_angle")
    if isinstance(pressure, bool) or not isinstance(pressure, (int, float)) or not math.isfinite(pressure) or float(pressure) not in (14.5, 20.0, 25.0):
        raise ParameterError("pressure_angle must be 14.5, 20 or 25 degrees")
    width = _number(spec, "face_width", high=1000)
    bore = _number(spec, "bore_diameter", high=1000)
    backlash = spec.get("backlash")
    if isinstance(backlash, bool) or not isinstance(backlash, (int, float)) or not math.isfinite(backlash) or backlash < 0:
        raise ParameterError("backlash must be a nonnegative number")
    if backlash >= module * math.pi / 4:
        raise ParameterError("backlash is too large relative to tooth pitch")
    sigma = math.radians(angle)
    delta = math.atan2(teeth * math.sin(sigma), mate + teeth * math.cos(sigma))
    if not 0 < delta < math.pi / 2:
        raise ParameterError("shaft_angle and tooth ratio produce an unsupported pitch cone")
    outer_distance = module * teeth / (2 * math.sin(delta))
    if width >= outer_distance / 3:
        raise ParameterError("face_width must be less than one third of outer cone distance")
    # Conservative bore safety at the small end of the tooth band.
    small_pitch_radius = (outer_distance - width) * math.sin(delta)
    if bore / 2 >= small_pitch_radius - 1.5 * module:
        raise ParameterError("bore_diameter leaves insufficient tooth-root material")
    return {
        "pitch_cone_angle": math.degrees(delta),
        "mate_pitch_cone_angle": angle - math.degrees(delta),
        "outer_cone_distance": outer_distance,
        "outer_pitch_diameter": module * teeth,
        "inner_pitch_radius": small_pitch_radius,
    }


def generate_straight_bevel_scad(spec: Mapping[str, Any]) -> str:
    """Use BOSL2's actual bevel_gear implementation; never fake teeth with wedges."""
    from .geometry import _fmt

    straight_bevel_dimensions(spec)
    return (
        "// OrkiCAD AI straight bevel gear prototype. Units: mm. Requires BOSL2.\n"
        "// Pitch-cone geometry validated; tooth contact and fabrication fit NOT certified.\n"
        "include <BOSL2/std.scad>\n"
        "include <BOSL2/gears.scad>\n"
        "bevel_gear("
        f"mod={_fmt(spec['module'])}, "
        f"teeth={spec['teeth']}, mate_teeth={spec['mate_teeth']}, "
        f"shaft_angle={_fmt(spec['shaft_angle'])}, "
        f"face_width={_fmt(spec['face_width'])}, "
        f"shaft_diam={_fmt(spec['bore_diameter'])}, "
        f"pressure_angle={_fmt(spec['pressure_angle'])}, "
        f"backlash={_fmt(spec['backlash'])}, "
        "spiral=0, cutter_radius=0, slices=8"
        ");\n"
    )
