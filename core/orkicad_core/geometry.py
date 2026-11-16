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

    Supported types: washer, mounting_plate, open_box, metric_screw,\n    metric_nut and spur_gear.
    Does not accept arbitrary Python, shell commands or SCAD source from AI.
    """
    if not isinstance(spec, Mapping):
        raise ParameterError("spec must be an object")
    kind = spec.get("type")
    if kind == "bevel_gear_straight":
        from .bevel_gears import generate_straight_bevel_scad
        return generate_straight_bevel_scad(spec)
    if kind == "split_ring":
        outer_diameter = _number(spec, "outer_diameter")
        inner_radius = _number(spec, "inner_radius")
        arc_gap = _number(spec, "outer_arc_gap")
        height = _number(spec, "thickness")
        radius = outer_diameter / 2
        if inner_radius >= radius:
            raise ParameterError("Inner radius must be smaller than outside radius")
        if arc_gap >= 2 * math.pi * radius:
            raise ParameterError("Removed arc must be shorter than outer circumference")
        # Arc length s=R*theta, NOT a 20 mm chord or angular 20 degrees.
        # All points are on concentric circles; both free ends follow radii.
        half_angle = arc_gap / (2 * radius)
        retained_sweep = 2 * math.pi - 2 * half_angle
        segments = max(96, math.ceil(384 * retained_sweep / (2 * math.pi)))
        outer_points = [
            (radius * math.cos(half_angle + retained_sweep * i / segments),
             radius * math.sin(half_angle + retained_sweep * i / segments))
            for i in range(segments + 1)
        ]
        inner_points = [
            (inner_radius * math.cos(half_angle + retained_sweep * i / segments),
             inner_radius * math.sin(half_angle + retained_sweep * i / segments))
            for i in range(segments, -1, -1)
        ]
        points = ",".join(f"[{_fmt(x)},{_fmt(y)}]" for x, y in
                          outer_points + inner_points)
        return ("// Open ring: true concentric arcs and radial cut boundaries. Units mm.\\n"
                f"linear_extrude(height={_fmt(height)}) "
                f"polygon(points=[{points}]);\\n")
    if kind == "solid_shaft":
        diameter = _number(spec, "diameter")
        length = _number(spec, "length")
        return ("// OrkiCAD AI. Units: mm.\n"
                f"cylinder(h={_fmt(length)},d={_fmt(diameter)},$fn=128);\n")
    if kind == "hollow_tube":
        outer = _number(spec, "outer_diameter")
        inner = _number(spec, "inner_diameter")
        length = _number(spec, "length")
        if inner >= outer:
            raise ParameterError("inner_diameter must be smaller than outer_diameter")
        return ("// OrkiCAD AI. Units: mm.\n"
                "difference() {\n"
                f"  cylinder(h={_fmt(length)},d={_fmt(outer)},$fn=128);\n"
                f"  translate([0,0,-0.1]) cylinder(h={_fmt(length + .2)},d={_fmt(inner)},$fn=128);\n"
                "}\n")
    if kind == "angle_bracket":
        width = _number(spec, "width")
        depth = _number(spec, "depth")
        height = _number(spec, "height")
        thickness = _number(spec, "thickness")
        if thickness >= min(depth, height):
            raise ParameterError("thickness must be smaller than both bracket legs")
        return ("// OrkiCAD AI. Units: mm.\n"
                "union() {\n"
                f"  cube([{_fmt(width)},{_fmt(depth)},{_fmt(thickness)}]);\n"
                f"  cube([{_fmt(width)},{_fmt(thickness)},{_fmt(height)}]);\n"
                "}\n")
    if kind == "feature_model":
        from .feature_program import generate_feature_scad
        return generate_feature_scad(spec)
    if kind == "circular_plate":
        radius = _number(spec, "outer_radius")
        thickness = _number(spec, "thickness")
        hole_diameter = _number(spec, "hole_diameter")
        pattern_radius = _number(spec, "bolt_circle_radius")
        raw_count = spec.get("hole_count")
        if (isinstance(raw_count, bool) or not isinstance(raw_count, int)
                or not 1 <= raw_count <= 64):
            raise ParameterError("hole_count must be an integer from 1 to 64")
        if pattern_radius + hole_diameter / 2 >= radius:
            raise ParameterError("All radial holes must fit strictly inside the circular plate")
        if raw_count > 1 and (2 * pattern_radius *
                math.sin(math.pi / raw_count) <= hole_diameter):
            raise ParameterError("Radial holes must not overlap")
        cutters = "\n".join(
            f"  translate([{_fmt(pattern_radius * math.cos(2 * math.pi * i / raw_count))},"
            f"{_fmt(pattern_radius * math.sin(2 * math.pi * i / raw_count))},-0.1]) "
            f"cylinder(h={_fmt(thickness + .2)},d={_fmt(hole_diameter)},$fn=96);"
            for i in range(raw_count)
        )
        result = (
            "difference() {\n"
            f"  cylinder(h={_fmt(thickness)},r={_fmt(radius)},$fn=192);\n"
            f"{cutters}\n"
            "}\n"
        )
    elif kind == "washer":
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
    elif kind == "corner_plate":
        width = _number(spec, "width")
        depth = _number(spec, "depth")
        thickness = _number(spec, "thickness")
        corner = _number(spec, "corner_size")
        diameter = _number(spec, "hole_diameter")
        inset = _number(spec, "hole_inset")
        style = spec.get("corner_style")
        if style not in ("round", "chamfer"):
            raise ParameterError("corner_style must be round or chamfer")
        if corner >= min(width, depth) / 2:
            raise ParameterError("corner_size must be less than half the shortest side")
        if inset <= corner + diameter / 2 or inset >= width / 2:
            raise ParameterError("Mounting holes must remain outside the corner treatments")
        if diameter >= depth:
            raise ParameterError("Mounting holes must fit inside the plate")
        if style == "round":
            profile = (
                f"  translate([{_fmt(corner)},{_fmt(corner)}]) "
                f"offset(r={_fmt(corner)}, $fn=96) "
                f"square([{_fmt(width - 2 * corner)},"
                f"{_fmt(depth - 2 * corner)}]);\n"
            )
        else:
            vertices = [
                (corner, 0), (width - corner, 0),
                (width, corner), (width, depth - corner),
                (width - corner, depth), (corner, depth),
                (0, depth - corner), (0, corner),
            ]
            points = ",".join(
                f"[{_fmt(x)},{_fmt(y)}]" for x, y in vertices
            )
            profile = f"  polygon(points=[{points}]);\n"
        drills = "\n".join(
            f"  translate([{_fmt(x)},{_fmt(depth / 2)},-0.1]) "
            f"cylinder(h={_fmt(thickness + .2)},"
            f"d={_fmt(diameter)},$fn=96);"
            for x in (inset, width - inset)
        )
        result = (
            "difference() {\n"
            f"  linear_extrude(height={_fmt(thickness)}) {{\n"
            f"{profile}"
            "  }\n"
            f"{drills}\n"
            "}\n"
        )
    elif kind == "machined_block":
        width = _number(spec, "width")
        depth = _number(spec, "depth")
        height = _number(spec, "height")
        hole = _number(spec, "hole_diameter")
        inset = _number(spec, "hole_inset")
        pocket_w = _number(spec, "pocket_width")
        pocket_d = _number(spec, "pocket_depth")
        cut = _number(spec, "pocket_cut_depth")
        if pocket_w >= width or pocket_d >= depth or cut >= height:
            raise ParameterError("Pocket must fit inside block with a solid floor")
        if inset <= hole / 2 or inset + hole / 2 >= width / 2:
            raise ParameterError("Mounting holes must be separate and inside block")
        if hole >= depth:
            raise ParameterError("Mounting hole exceeds block depth")
        # Both holes sit outside the centered pocket with real edge clearance.
        pocket_left = (width - pocket_w) / 2
        if inset + hole / 2 >= pocket_left:
            raise ParameterError("Mounting holes must not intersect the centered pocket")
        px = pocket_left
        py = (depth - pocket_d) / 2
        cutters = "\n".join(
            f"  translate([{_fmt(x)},{_fmt(depth / 2)},-0.1]) "
            f"cylinder(h={_fmt(height + .2)}, d={_fmt(hole)}, $fn=96);"
            for x in (inset, width - inset)
        )
        result = (
            "difference() {\n"
            f"  cube([{_fmt(width)},{_fmt(depth)},{_fmt(height)}]);\n"
            f"{cutters}\n"
            f"  translate([{_fmt(px)},{_fmt(py)},{_fmt(height-cut)}]) "
            f"cube([{_fmt(pocket_w)},{_fmt(pocket_d)},{_fmt(cut + .1)}]);\n"
            "}\n"
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
    elif kind in ("box_lid", "bottle_cap"):
        from .consumer_parts import make_closure
        return make_closure(spec)
    elif kind in ("metric_screw", "metric_nut", "spur_gear"):
        from .mechanical import generate_mechanical_scad
        return generate_mechanical_scad(spec)
    else:
        raise ParameterError(
            "type must be one of: corner_plate, machined_block, washer, mounting_plate, open_box, "
            "metric_screw, metric_nut, spur_gear, box_lid, bottle_cap"
        )
    return "// OrkiCAD AI prototype. Units: mm.\n" + result
