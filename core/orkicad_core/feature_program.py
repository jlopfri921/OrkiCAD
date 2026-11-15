"""Small, validated declarative CAD operation language (v0 prototype).

Only a bounded base box and an ordered list of typed additive/subtractive
primitives are accepted. No scripts, expressions, paths, or external references.
The same normalized program drives OpenSCAD mesh and OCCT B-rep backends.
"""
from __future__ import annotations

import math

MAX_OPERATIONS = 8
MAX_LENGTH = 500.0
EXAMPLE_OPERATIONS = [
    {"op": "cut", "shape": "box", "position": [26, 15, 7],
     "size": [48, 30, 6]},
    {"op": "cut", "shape": "cylinder", "position": [12, 30, -0.1],
     "radius": 3, "height": 12.2},
    {"op": "cut", "shape": "cylinder", "position": [88, 30, -0.1],
     "radius": 3, "height": 12.2},
    {"op": "add", "shape": "cylinder", "position": [50, 50, 11.8],
     "radius": 7, "height": 8},
]


def _numeric(item, label, *, positive=False, allow_negative=False):
    from .geometry import ParameterError
    if isinstance(item, bool) or not isinstance(item, (int, float)):
        raise ParameterError(f"{label} must be numeric")
    value = float(item)
    if not math.isfinite(value) or abs(value) > MAX_LENGTH:
        raise ParameterError(f"{label} must be finite and within 500 mm")
    if positive and value <= 0:
        raise ParameterError(f"{label} must be positive")
    if not allow_negative and value < 0:
        raise ParameterError(f"{label} must be non-negative")
    return value


def _vector(values, key, *, positive=False, allow_negative=False):
    from .geometry import ParameterError
    if not isinstance(values, list) or len(values) != 3:
        raise ParameterError(f"{key} must have three numeric components")
    return [_numeric(v, f"{key}[{i}]", positive=positive,
                     allow_negative=allow_negative)
            for i, v in enumerate(values)]


def _intersects(a_min, a_max, b_min, b_max):
    # Strict overlap disallows disconnected additions/tangent-only additions.
    return all(a_min[i] < b_max[i] - 1e-7 and
               a_max[i] > b_min[i] + 1e-7 for i in range(3))


def validate_feature_model(spec):
    """Strictly whitelist geometry operations and reject unbounded requests."""
    from .geometry import ParameterError

    if not isinstance(spec, dict) or spec.get("type") != "feature_model":
        raise ParameterError("Feature program must be a feature_model object")
    if set(spec) != {"type", "width", "depth", "height", "operations"}:
        raise ParameterError("feature_model accepts only type, width, depth, height, operations")
    width = _numeric(spec["width"], "width", positive=True)
    depth = _numeric(spec["depth"], "depth", positive=True)
    height = _numeric(spec["height"], "height", positive=True)
    operations = spec["operations"]
    if not isinstance(operations, list) or not 1 <= len(operations) <= MAX_OPERATIONS:
        raise ParameterError("operations must be a list of 1 to 8 items")
    normalized = []
    base_min, base_max = [0., 0., 0.], [width, depth, height]
    for i, item in enumerate(operations):
        if not isinstance(item, dict):
            raise ParameterError(f"operations[{i}] must be an object")
        op = item.get("op")
        shape = item.get("shape")
        if op not in ("add", "cut") or shape not in ("box", "cylinder"):
            raise ParameterError(f"operations[{i}] has unsupported op or shape")
        required = {"op", "shape", "position"}
        required |= {"size"} if shape == "box" else {"radius", "height"}
        if set(item) != required:
            raise ParameterError(f"operations[{i}] has missing or unknown fields")
        position = _vector(item["position"], f"operations[{i}].position",
                           allow_negative=True)
        if shape == "box":
            size = _vector(item["size"], f"operations[{i}].size", positive=True)
            extent = size
            extra = {"size": size}
        else:
            radius = _numeric(item["radius"], f"operations[{i}].radius", positive=True)
            cyl_height = _numeric(item["height"], f"operations[{i}].height", positive=True)
            extent = [radius, radius, cyl_height]
            extra = {"radius": radius, "height": cyl_height}
        if shape == "cylinder":
            tool_min = [position[0] - extent[0], position[1] - extent[1], position[2]]
            tool_max = [position[0] + extent[0], position[1] + extent[1], position[2] + extent[2]]
        else:
            tool_min = position
            tool_max = [position[j] + extent[j] for j in range(3)]
        if not _intersects(base_min, base_max, tool_min, tool_max):
            raise ParameterError(
                f"operations[{i}] must overlap the base block; detached solids are not supported"
            )
        normalized.append({"op": op, "shape": shape, "position": position, **extra})
    return {"type": "feature_model", "width": width, "depth": depth,
            "height": height, "operations": normalized}


def generate_feature_scad(spec):
    """Compile an allowlisted operation list into deterministic OpenSCAD."""
    from .geometry import _fmt
    s = validate_feature_model(spec)

    def triplet(values):
        return "[" + ",".join(_fmt(v) for v in values) + "]"

    def primitive(feature):
        pos = triplet(feature["position"])
        if feature["shape"] == "box":
            shape = f"cube({triplet(feature['size'])});"
        else:
            shape = (f"cylinder(r={_fmt(feature['radius'])},"
                     f"h={_fmt(feature['height'])},$fn=96);")
        return f"translate({pos}) {shape}"

    expression = (f"cube({triplet([s['width'], s['depth'], s['height']])});")
    for feature in s["operations"]:
        operation = "union" if feature["op"] == "add" else "difference"
        body = "\n".join("  " + line for line in expression.splitlines())
        expression = (f"{operation}() {{\n{body}\n"
                      f"  {primitive(feature)}\n}}\n")
    return "// OrkiCAD feature program. Units: mm.\n" + expression
